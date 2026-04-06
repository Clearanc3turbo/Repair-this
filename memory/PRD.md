# FixBook - Mixed Repairs Service Platform PRD

## Original Problem Statement
Web platform for an in-house electronics repair business. Customers can request/book repair jobs, get quotes, pay securely, and be matched with technicians. 3 user groups: Customers, Technicians, Admin.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (port 3000)
- **Backend**: FastAPI (port 8001, /api prefix)
- **Database**: MongoDB (collections: users, bookings, payments, chat_messages, files, login_attempts)
- **AI**: GPT-5.2 via Emergent LLM key (emergentintegrations library)
- **Storage**: Emergent Object Storage for photo uploads
- **Payments**: MOCKED PayPal (structure ready for real integration)
- **Auth**: JWT with httpOnly cookies, bcrypt password hashing

## User Personas
1. **Customer** - Books repairs, submits issues with photos, tracks progress, pays after completion
2. **Technician** - Views assigned jobs, updates status, adds repair notes
3. **Admin** - Manages bookings/quotes/technicians/users, views stats

## Core Requirements
- [x] User authentication (register, login, logout, role-based access)
- [x] Service categories (Phone, Laptop, TV, Tablet, Gaming Console, Audio)
- [x] Multi-step booking wizard (category → details + photos → schedule → review)
- [x] Quote/estimate workflow (admin sets quote → customer approves)
- [x] Technician assignment and status tracking
- [x] Mock payment flow (pay after completion)
- [x] AI-powered chat support (GPT-5.2)
- [x] Photo upload during booking
- [x] Admin dashboard with stats
- [x] Role-based routing

## What's Been Implemented (April 2026)
- Full auth system with JWT, brute force protection, admin seeding
- Landing page with Swiss high-contrast design
- Customer dashboard with booking management
- 4-step booking wizard with calendar, photo upload
- Booking detail with quote approval, payment, cancellation
- Technician dashboard with job status updates and notes
- Admin dashboard with stats, bookings table, quote management, technician assignment, user management
- AI chat widget (GPT-5.2)
- Object storage integration for photos
- Mocked PayPal payment flow

## Prioritized Backlog
### P0 (Done)
- Core booking flow, auth, role-based dashboards

### P1 (Next)
- Real PayPal integration (needs client_id and secret)
- WhatsApp notifications via Twilio
- Email notifications via SendGrid/Resend
- Reviews and ratings system

### P2
- Dynamic pricing by urgency
- Subscription maintenance plans
- Promo codes and referral system
- Multi-city service expansion
- Inventory/parts management

## Next Tasks
1. Integrate real PayPal when user provides API keys
2. Add notification system (WhatsApp + Email)
3. Implement reviews/ratings for completed jobs
4. Add customer profile editing
5. Enhanced admin reporting with charts
