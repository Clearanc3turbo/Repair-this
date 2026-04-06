import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Plus, Package, Clock, CheckCircle, XCircle } from "lucide-react";

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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status.toUpperCase(), color: "bg-gray-100 text-gray-800" };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] border ${cfg.color}`}>{cfg.label}</span>;
}

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/bookings").then(r => setBookings(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const active = bookings.filter(b => !["completed", "cancelled"].includes(b.status));
  const past = bookings.filter(b => ["completed", "cancelled"].includes(b.status));

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" data-testid="customer-dashboard">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F0F13]">My Repairs</h1>
          <p className="font-body text-sm text-[#6C6C75] mt-1">{bookings.length} total bookings</p>
        </div>
        <Link
          to="/dashboard/new-booking"
          className="inline-flex items-center gap-2 bg-[#FF3B30] text-white font-medium px-5 py-2.5 text-sm hover:bg-[#D93025] transition-colors"
          data-testid="new-booking-btn"
        >
          <Plus className="h-4 w-4" /> New Booking
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="rounded-none bg-[#F7F7F9] border border-[#E5E5EA] p-0 h-auto">
          <TabsTrigger value="active" className="rounded-none px-6 py-2.5 text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-none" data-testid="tab-active">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-none px-6 py-2.5 text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-none" data-testid="tab-past">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Past ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {active.length === 0 ? (
            <div className="text-center py-16 border border-[#E5E5EA] bg-[#F7F7F9]">
              <Package className="h-10 w-10 text-[#E5E5EA] mx-auto mb-3" />
              <p className="font-body text-[#6C6C75]">No active bookings</p>
              <Link to="/dashboard/new-booking" className="text-[#FF3B30] text-sm font-medium mt-2 inline-block hover:underline">Book your first repair</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          {past.length === 0 ? (
            <div className="text-center py-16 border border-[#E5E5EA] bg-[#F7F7F9]">
              <p className="font-body text-[#6C6C75]">No past bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <Link
      to={`/dashboard/booking/${booking.id}`}
      className="block border border-[#E5E5EA] bg-white p-5 hover:bg-[#F7F7F9] transition-colors group"
      data-testid={`booking-card-${booking.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-heading text-base font-semibold text-[#0F0F13] truncate">{booking.category_name}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="font-body text-sm text-[#6C6C75] truncate">{booking.issue_description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs font-mono text-[#6C6C75]">
            <span>{booking.preferred_date}</span>
            <span>{booking.preferred_time}</span>
            {booking.technician_name && <span>Tech: {booking.technician_name}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {booking.quote && (
            <p className="font-mono text-sm font-semibold text-[#0F0F13]">${booking.quote.estimated_cost}</p>
          )}
          {booking.payment_status === "paid" && (
            <Badge className="mt-1 bg-emerald-100 text-emerald-800 border-emerald-200 rounded-none text-[10px] font-mono">PAID</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
