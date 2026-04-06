import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../lib/api";
import { toast } from "../../components/ui/sonner";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, User, Clock, MapPin, CreditCard, MessageSquare } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "PENDING", color: "bg-amber-100 text-amber-800 border-amber-200" },
  quoted: { label: "QUOTED", color: "bg-blue-100 text-blue-800 border-blue-200" },
  approved: { label: "APPROVED", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  assigned: { label: "ASSIGNED", color: "bg-purple-100 text-purple-800 border-purple-200" },
  on_the_way: { label: "ON THE WAY", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  in_progress: { label: "IN PROGRESS", color: "bg-orange-100 text-orange-800 border-orange-200" },
  completed: { label: "COMPLETED", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "CANCELLED", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchBooking = () => {
    API.get(`/bookings/${id}`).then(r => setBooking(r.data)).catch(() => toast.error("Booking not found")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handleApproveQuote = async () => {
    try {
      await API.post(`/bookings/${id}/approve-quote`);
      toast.success("Quote approved!");
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  const handleCancel = async () => {
    try {
      await API.post(`/bookings/${id}/cancel`);
      toast.success("Booking cancelled");
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data: payment } = await API.post("/payments/create", { booking_id: id });
      await API.post(`/payments/${payment.payment_id}/complete`);
      toast.success("Payment completed (simulated)!");
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Payment error");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent animate-spin" /></div>;
  if (!booking) return <div className="p-10 text-center font-body text-[#6C6C75]">Booking not found</div>;

  const cfg = STATUS_CONFIG[booking.status] || { label: booking.status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" data-testid="booking-detail">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm font-body text-[#6C6C75] hover:text-[#0F0F13] mb-6 transition-colors" data-testid="back-to-dashboard">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#0F0F13]">{booking.category_name}</h1>
          <p className="font-mono text-xs text-[#6C6C75] mt-1">ID: {booking.id.slice(0, 8)}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-mono uppercase tracking-[0.15em] border ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75] mb-2">Issue Details</p>
          <p className="font-body text-sm text-[#0F0F13]">{booking.issue_description}</p>
          {booking.device_brand && <p className="font-body text-xs text-[#6C6C75] mt-1">Device: {booking.device_brand} {booking.device_model}</p>}
        </div>

        <div className="p-5 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Schedule</p>
              <p className="font-body text-sm text-[#0F0F13]">{booking.preferred_date} at {booking.preferred_time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Location</p>
              <p className="font-body text-sm text-[#0F0F13]">{booking.address}</p>
            </div>
          </div>
        </div>

        {booking.technician_name && (
          <div className="p-5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Technician</p>
                <p className="font-body text-sm text-[#0F0F13]">{booking.technician_name}</p>
              </div>
            </div>
          </div>
        )}

        {booking.quote && (
          <div className="p-5 bg-[#F7F7F9]">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Quote</p>
            </div>
            <p className="font-heading text-2xl font-bold text-[#0F0F13]">${booking.quote.estimated_cost}</p>
            {booking.quote.breakdown && <p className="font-body text-sm text-[#6C6C75] mt-1">{booking.quote.breakdown}</p>}
            {booking.quote.notes && <p className="font-body text-xs text-[#6C6C75] mt-1">{booking.quote.notes}</p>}
          </div>
        )}

        {booking.technician_notes && booking.technician_notes.length > 0 && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Technician Notes</p>
            </div>
            <div className="space-y-2">
              {booking.technician_notes.map((n, i) => (
                <div key={i} className="text-sm font-body text-[#0F0F13] border-l-2 border-[#E5E5EA] pl-3">
                  <p>{n.text}</p>
                  <p className="text-[10px] font-mono text-[#6C6C75] mt-0.5">{n.by} &middot; {new Date(n.at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.payment_status === "paid" && (
          <div className="p-5 bg-emerald-50">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 rounded-none text-xs font-mono">PAYMENT COMPLETE &mdash; ${booking.payment_amount}</Badge>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        {booking.status === "quoted" && (
          <button onClick={handleApproveQuote} className="bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors" data-testid="approve-quote-btn">
            Approve Quote
          </button>
        )}
        {booking.status === "completed" && booking.payment_status !== "paid" && (
          <button onClick={handlePay} disabled={paying} className="bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors disabled:opacity-50" data-testid="pay-now-btn">
            {paying ? "Processing..." : `Pay $${booking.final_cost || booking.quote?.estimated_cost || 0}`}
          </button>
        )}
        {!["completed", "cancelled"].includes(booking.status) && (
          <button onClick={handleCancel} className="bg-white text-[#FF3B30] font-medium px-6 py-2.5 text-sm border border-[#FF3B30] hover:bg-red-50 transition-colors" data-testid="cancel-booking-btn">
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
}
