from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Response, Query, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import secrets
import requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), os.environ.get("CORS_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Constants ──
JWT_ALGORITHM = "HS256"
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "fixbook"
storage_key = None

SERVICE_CATEGORIES = [
    {"id": "phone", "name": "Phone Repair", "description": "Screen replacement, battery swap, water damage, charging port", "icon": "smartphone", "base_price": 49},
    {"id": "laptop", "name": "Laptop Repair", "description": "Screen repair, keyboard replacement, motherboard fix, SSD upgrade", "icon": "laptop", "base_price": 89},
    {"id": "tv", "name": "TV Repair", "description": "Screen issues, power supply, backlight, HDMI port repair", "icon": "tv", "base_price": 129},
    {"id": "tablet", "name": "Tablet Repair", "description": "Screen replacement, battery, charging issues, software fix", "icon": "tablet", "base_price": 59},
    {"id": "gaming", "name": "Gaming Console", "description": "HDMI repair, overheating fix, disc drive, controller port", "icon": "gamepad-2", "base_price": 79},
    {"id": "audio", "name": "Audio Equipment", "description": "Headphones, speakers, amplifiers, turntable repair", "icon": "headphones", "base_price": 39},
]

BOOKING_STATUSES = ["pending", "quoted", "approved", "assigned", "on_the_way", "in_progress", "completed", "cancelled"]

# ── Helpers ──
def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response, access_token, refresh_token):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize_doc(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

# ── Object Storage ──
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        logger.warning("EMERGENT_LLM_KEY not set, storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": emergent_key}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── Pydantic Models ──
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None
    role: Optional[str] = "customer"

class LoginInput(BaseModel):
    email: str
    password: str

class BookingInput(BaseModel):
    category_id: str
    issue_description: str
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    address: str
    preferred_date: str
    preferred_time: str
    urgency: Optional[str] = "normal"
    photo_ids: Optional[List[str]] = []

class QuoteInput(BaseModel):
    estimated_cost: float
    breakdown: Optional[str] = None
    notes: Optional[str] = None

class StatusUpdateInput(BaseModel):
    status: str
    notes: Optional[str] = None

class ChatInput(BaseModel):
    message: str
    session_id: Optional[str] = None

class TechnicianNoteInput(BaseModel):
    notes: str
    final_cost: Optional[float] = None

# ── Auth Routes ──
@api_router.post("/auth/register")
async def register(inp: RegisterInput):
    email = inp.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if inp.role not in ["customer", "technician"]:
        inp.role = "customer"
    user_doc = {
        "email": email,
        "password_hash": hash_password(inp.password),
        "name": inp.name,
        "phone": inp.phone or "",
        "role": inp.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    from starlette.responses import JSONResponse
    resp = JSONResponse(content={"id": user_id, "email": email, "name": inp.name, "role": inp.role})
    set_auth_cookies(resp, access_token, refresh_token)
    return resp

@api_router.post("/auth/login")
async def login(inp: LoginInput):
    email = inp.email.lower().strip()
    identifier = email
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("locked_until")
        if lockout_until and datetime.now(timezone.utc) < datetime.fromisoformat(lockout_until):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    from starlette.responses import JSONResponse
    resp = JSONResponse(content={"id": user_id, "email": email, "name": user["name"], "role": user["role"]})
    set_auth_cookies(resp, access_token, refresh_token)
    return resp

@api_router.post("/auth/logout")
async def logout():
    from starlette.responses import JSONResponse
    resp = JSONResponse(content={"message": "Logged out"})
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")
    return resp

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        from starlette.responses import JSONResponse
        resp = JSONResponse(content={"message": "Token refreshed"})
        resp.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return resp
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ── Services ──
@api_router.get("/services")
async def get_services():
    return SERVICE_CATEGORIES

# ── File Upload ──
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    file_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "user_id": user["_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    return {"id": file_doc["id"], "path": result["path"], "filename": file.filename}

@api_router.get("/files/{path:path}")
async def download_file(path: str, auth: str = Query(None)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ── Bookings ──
@api_router.post("/bookings")
async def create_booking(inp: BookingInput, request: Request):
    user = await get_current_user(request)
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create bookings")
    category = next((c for c in SERVICE_CATEGORIES if c["id"] == inp.category_id), None)
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category")
    booking = {
        "id": str(uuid.uuid4()),
        "customer_id": user["_id"],
        "customer_name": user["name"],
        "customer_email": user["email"],
        "customer_phone": user.get("phone", ""),
        "category_id": inp.category_id,
        "category_name": category["name"],
        "issue_description": inp.issue_description,
        "device_brand": inp.device_brand or "",
        "device_model": inp.device_model or "",
        "address": inp.address,
        "preferred_date": inp.preferred_date,
        "preferred_time": inp.preferred_time,
        "urgency": inp.urgency,
        "photo_ids": inp.photo_ids or [],
        "status": "pending",
        "quote": None,
        "technician_id": None,
        "technician_name": None,
        "technician_notes": [],
        "payment_status": "unpaid",
        "payment_amount": None,
        "final_cost": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.insert_one(booking)
    booking.pop("_id", None)
    return booking

@api_router.get("/bookings")
async def get_bookings(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    query = {"customer_id": user["_id"]}
    if status:
        query["status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user["role"] == "customer" and booking["customer_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return booking

@api_router.post("/bookings/{booking_id}/approve-quote")
async def approve_quote(booking_id: str, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["customer_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if booking["status"] != "quoted":
        raise HTTPException(status_code=400, detail="Booking is not in quoted status")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Quote approved"}

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user["role"] == "customer" and booking["customer_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if booking["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Booking cancelled"}

# ── Payments (Mocked PayPal) ──
@api_router.post("/payments/create")
async def create_payment(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    booking_id = body.get("booking_id")
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["customer_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    amount = booking.get("final_cost") or (booking.get("quote", {}) or {}).get("estimated_cost", 0)
    payment = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_id,
        "customer_id": user["_id"],
        "amount": amount,
        "currency": "USD",
        "status": "pending",
        "method": "paypal_mock",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payments.insert_one(payment)
    payment.pop("_id", None)
    return {"payment_id": payment["id"], "amount": amount, "status": "pending", "message": "Payment created (mock). In production, this would redirect to PayPal."}

@api_router.post("/payments/{payment_id}/complete")
async def complete_payment(payment_id: str, request: Request):
    user = await get_current_user(request)
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}})
    await db.bookings.update_one({"id": payment["booking_id"]}, {"$set": {"payment_status": "paid", "payment_amount": payment["amount"], "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Payment completed (mock)", "status": "completed"}

@api_router.get("/payments")
async def get_payments(request: Request):
    user = await get_current_user(request)
    query = {"customer_id": user["_id"]}
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return payments

# ── Technician Routes ──
@api_router.get("/technician/jobs")
async def get_technician_jobs(request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["technician", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    jobs = await db.bookings.find({"technician_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return jobs

@api_router.put("/technician/jobs/{booking_id}/status")
async def update_job_status(booking_id: str, inp: StatusUpdateInput, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["technician", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Job not found")
    if user["role"] == "technician" and booking.get("technician_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Not assigned to this job")
    if inp.status not in BOOKING_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    update = {"status": inp.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if inp.notes:
        note = {"text": inp.notes, "by": user["name"], "at": datetime.now(timezone.utc).isoformat()}
        await db.bookings.update_one({"id": booking_id}, {"$push": {"technician_notes": note}})
    await db.bookings.update_one({"id": booking_id}, {"$set": update})
    return {"message": "Status updated"}

@api_router.post("/technician/jobs/{booking_id}/notes")
async def add_job_note(booking_id: str, inp: TechnicianNoteInput, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["technician", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    note = {"text": inp.notes, "by": user["name"], "at": datetime.now(timezone.utc).isoformat()}
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if inp.final_cost is not None:
        update_fields["final_cost"] = inp.final_cost
    await db.bookings.update_one({"id": booking_id}, {"$push": {"technician_notes": note}, "$set": update_fields})
    return {"message": "Note added"}

# ── Admin Routes ──
@api_router.get("/admin/bookings")
async def admin_get_bookings(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    query = {}
    if status:
        query["status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return bookings

@api_router.post("/admin/bookings/{booking_id}/quote")
async def admin_set_quote(booking_id: str, inp: QuoteInput, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    quote = {
        "estimated_cost": inp.estimated_cost,
        "breakdown": inp.breakdown or "",
        "notes": inp.notes or "",
        "quoted_by": user["name"],
        "quoted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.update_one({"id": booking_id}, {"$set": {"quote": quote, "status": "quoted", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Quote set"}

@api_router.post("/admin/bookings/{booking_id}/assign")
async def admin_assign_technician(booking_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    body = await request.json()
    tech_id = body.get("technician_id")
    tech = await db.users.find_one({"_id": ObjectId(tech_id), "role": "technician"})
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")
    await db.bookings.update_one({"id": booking_id}, {"$set": {
        "technician_id": str(tech["_id"]),
        "technician_name": tech["name"],
        "status": "assigned",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    return {"message": f"Assigned to {tech['name']}"}

@api_router.get("/admin/technicians")
async def admin_get_technicians(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    techs = await db.users.find({"role": "technician"}, {"_id": 0, "password_hash": 0}).to_list(100)
    # Include _id as string
    techs_raw = await db.users.find({"role": "technician"}).to_list(100)
    result = []
    for t in techs_raw:
        result.append({"id": str(t["_id"]), "name": t["name"], "email": t["email"], "phone": t.get("phone", ""), "created_at": t.get("created_at", "")})
    return result

@api_router.get("/admin/users")
async def admin_get_users(request: Request, role: Optional[str] = None):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    query = {}
    if role:
        query["role"] = role
    users_raw = await db.users.find(query).to_list(200)
    result = []
    for u in users_raw:
        result.append({"id": str(u["_id"]), "name": u["name"], "email": u["email"], "phone": u.get("phone", ""), "role": u["role"], "created_at": u.get("created_at", "")})
    return result

@api_router.get("/admin/stats")
async def admin_get_stats(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_bookings = await db.bookings.count_documents({})
    pending = await db.bookings.count_documents({"status": "pending"})
    in_progress = await db.bookings.count_documents({"status": {"$in": ["assigned", "on_the_way", "in_progress"]}})
    completed = await db.bookings.count_documents({"status": "completed"})
    cancelled = await db.bookings.count_documents({"status": "cancelled"})
    total_customers = await db.users.count_documents({"role": "customer"})
    total_technicians = await db.users.count_documents({"role": "technician"})
    total_revenue_pipeline = db.payments.aggregate([{"$match": {"status": "completed"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}])
    rev_list = await total_revenue_pipeline.to_list(1)
    total_revenue = rev_list[0]["total"] if rev_list else 0
    return {
        "total_bookings": total_bookings,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "cancelled": cancelled,
        "total_customers": total_customers,
        "total_technicians": total_technicians,
        "total_revenue": total_revenue
    }

@api_router.post("/admin/users")
async def admin_create_user(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    body = await request.json()
    email = body.get("email", "").lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    user_doc = {
        "email": email,
        "password_hash": hash_password(body.get("password", "changeme123")),
        "name": body.get("name", ""),
        "phone": body.get("phone", ""),
        "role": body.get("role", "technician"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    return {"id": str(result.inserted_id), "email": email, "name": user_doc["name"], "role": user_doc["role"]}

# ── AI Chat ──
@api_router.post("/chat")
async def ai_chat(inp: ChatInput, request: Request):
    user = await get_current_user(request)
    session_id = inp.session_id or str(uuid.uuid4())
    # Get chat history
    history = await db.chat_messages.find({"session_id": session_id, "user_id": user["_id"]}, {"_id": 0}).sort("created_at", 1).to_list(20)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        emergent_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"fixbook-{session_id}",
            system_message="""You are FixBook AI, a helpful electronics repair assistant. You help customers:
1. Diagnose common electronics issues (phones, laptops, TVs, tablets, gaming consoles, audio equipment)
2. Provide rough cost estimates for repairs
3. Recommend whether professional repair is needed or if it's a DIY fix
4. Guide them through the booking process

Be concise, professional, and helpful. If you're unsure about a specific repair cost, give a reasonable range.
Common repair price ranges:
- Phone screen: $49-$199
- Phone battery: $29-$79
- Laptop screen: $89-$299
- Laptop keyboard: $49-$149
- TV backlight: $100-$300
- Gaming console HDMI: $79-$149"""
        ).with_model("openai", "gpt-5.2")
        # Add history context
        for msg in history:
            if msg["role"] == "user":
                await chat.send_message(UserMessage(text=msg["content"]))
        response = await chat.send_message(UserMessage(text=inp.message))
        # Store messages
        user_msg = {"session_id": session_id, "user_id": user["_id"], "role": "user", "content": inp.message, "created_at": datetime.now(timezone.utc).isoformat()}
        ai_msg = {"session_id": session_id, "user_id": user["_id"], "role": "assistant", "content": response, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.chat_messages.insert_many([user_msg, ai_msg])
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        return {"response": "I'm having trouble connecting right now. Please try again or contact support directly.", "session_id": session_id}

@api_router.get("/chat/history")
async def get_chat_history(request: Request, session_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {"user_id": user["_id"]}
    if session_id:
        query["session_id"] = session_id
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(100)
    return messages

# ── Root ──
@api_router.get("/")
async def root():
    return {"message": "FixBook API"}

# ── Startup ──
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.bookings.create_index("customer_id")
    await db.bookings.create_index("technician_id")
    await db.bookings.create_index("id", unique=True)
    await db.payments.create_index("id", unique=True)
    await db.chat_messages.create_index("session_id")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@fixbook.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Admin", "phone": "", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    # Seed sample technician
    tech_email = "tech@fixbook.com"
    if not await db.users.find_one({"email": tech_email}):
        await db.users.insert_one({"email": tech_email, "password_hash": hash_password("tech123"), "name": "Alex Martinez", "phone": "+1234567890", "role": "technician", "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info(f"Technician created: {tech_email}")
    # Write test credentials
    try:
        os.makedirs("/app/memory", exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write("# Test Credentials\n\n")
            f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
            f.write(f"## Technician\n- Email: tech@fixbook.com\n- Password: tech123\n- Role: technician\n\n")
            f.write("## Customer\n- Register a new account via /register\n- Role: customer\n\n")
            f.write("## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")
    except Exception as e:
        logger.error(f"Failed to write test credentials: {e}")
    # Init storage
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api_router)
