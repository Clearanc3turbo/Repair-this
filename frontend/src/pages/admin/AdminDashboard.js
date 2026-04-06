import { useState, useEffect } from "react";
import API from "../../lib/api";
import { toast } from "../../components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { LayoutDashboard, Package, Users, Wrench, DollarSign, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  quoted: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
  assigned: "bg-purple-100 text-purple-800 border-purple-200",
  on_the_way: "bg-cyan-100 text-cyan-800 border-cyan-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteDialog, setQuoteDialog] = useState(null);
  const [assignDialog, setAssignDialog] = useState(null);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ estimated_cost: "", breakdown: "", notes: "" });
  const [selectedTech, setSelectedTech] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "changeme123", phone: "", role: "technician" });

  const fetchAll = async () => {
    try {
      const [s, b, t, u] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/bookings"),
        API.get("/admin/technicians"),
        API.get("/admin/users"),
      ]);
      setStats(s.data);
      setBookings(b.data);
      setTechnicians(t.data);
      setUsers(u.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSetQuote = async () => {
    if (!quoteDialog || !quoteForm.estimated_cost) return;
    try {
      await API.post(`/admin/bookings/${quoteDialog.id}/quote`, {
        estimated_cost: parseFloat(quoteForm.estimated_cost),
        breakdown: quoteForm.breakdown,
        notes: quoteForm.notes,
      });
      toast.success("Quote set!");
      setQuoteDialog(null);
      setQuoteForm({ estimated_cost: "", breakdown: "", notes: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  const handleAssign = async () => {
    if (!assignDialog || !selectedTech) return;
    try {
      await API.post(`/admin/bookings/${assignDialog.id}/assign`, { technician_id: selectedTech });
      toast.success("Technician assigned!");
      setAssignDialog(null);
      setSelectedTech("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  const handleCreateUser = async () => {
    try {
      await API.post("/admin/users", newUser);
      toast.success("User created!");
      setCreateUserDialog(false);
      setNewUser({ name: "", email: "", password: "changeme123", phone: "", role: "technician" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-dashboard">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F0F13] mb-8">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E5E5EA] border border-[#E5E5EA] mb-10" data-testid="admin-stats">
          <div className="bg-white p-5">
            <Package className="h-4 w-4 text-[#6C6C75] mb-2" strokeWidth={1.5} />
            <p className="font-heading text-2xl font-bold text-[#0F0F13]">{stats.total_bookings}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Total Bookings</p>
          </div>
          <div className="bg-white p-5">
            <Clock className="h-4 w-4 text-amber-500 mb-2" strokeWidth={1.5} />
            <p className="font-heading text-2xl font-bold text-[#0F0F13]">{stats.pending}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Pending</p>
          </div>
          <div className="bg-white p-5">
            <CheckCircle className="h-4 w-4 text-emerald-500 mb-2" strokeWidth={1.5} />
            <p className="font-heading text-2xl font-bold text-[#0F0F13]">{stats.completed}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Completed</p>
          </div>
          <div className="bg-white p-5">
            <DollarSign className="h-4 w-4 text-[#FF3B30] mb-2" strokeWidth={1.5} />
            <p className="font-heading text-2xl font-bold text-[#0F0F13]">${stats.total_revenue.toFixed(2)}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Revenue</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="rounded-none bg-[#F7F7F9] border border-[#E5E5EA] p-0 h-auto">
          <TabsTrigger value="bookings" className="rounded-none px-6 py-2.5 text-sm font-body data-[state=active]:bg-white" data-testid="admin-tab-bookings">
            <Package className="h-3.5 w-3.5 mr-1.5" /> Bookings
          </TabsTrigger>
          <TabsTrigger value="technicians" className="rounded-none px-6 py-2.5 text-sm font-body data-[state=active]:bg-white" data-testid="admin-tab-technicians">
            <Wrench className="h-3.5 w-3.5 mr-1.5" /> Technicians
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-none px-6 py-2.5 text-sm font-body data-[state=active]:bg-white" data-testid="admin-tab-users">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Users
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-6">
          <div className="border border-[#E5E5EA]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F7F9]">
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">ID</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Customer</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Category</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Status</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em] text-right">Quote</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Technician</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(b => (
                  <TableRow key={b.id} data-testid={`admin-booking-${b.id}`}>
                    <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-body text-sm">{b.customer_name}</TableCell>
                    <TableCell className="font-body text-sm">{b.category_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] border ${STATUS_COLORS[b.status] || ""}`}>
                        {b.status.replace("_", " ").toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{b.quote ? `$${b.quote.estimated_cost}` : "—"}</TableCell>
                    <TableCell className="font-body text-sm">{b.technician_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.status === "pending" && (
                          <button onClick={() => { setQuoteDialog(b); setQuoteForm({ estimated_cost: "", breakdown: "", notes: "" }); }} className="text-xs font-medium text-[#007AFF] hover:underline" data-testid={`set-quote-${b.id}`}>
                            Set Quote
                          </button>
                        )}
                        {["approved", "quoted"].includes(b.status) && (
                          <button onClick={() => setAssignDialog(b)} className="text-xs font-medium text-[#007AFF] hover:underline" data-testid={`assign-tech-${b.id}`}>
                            Assign
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 font-body text-[#6C6C75]">No bookings yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">{technicians.length} Technician(s)</p>
            <button onClick={() => setCreateUserDialog(true)} className="flex items-center gap-1 bg-[#FF3B30] text-white font-medium px-4 py-2 text-sm hover:bg-[#D93025] transition-colors" data-testid="add-technician-btn">
              <Plus className="h-3.5 w-3.5" /> Add Technician
            </button>
          </div>
          <div className="border border-[#E5E5EA]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F7F9]">
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Email</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Phone</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map(t => (
                  <TableRow key={t.id} data-testid={`tech-row-${t.id}`}>
                    <TableCell className="font-body text-sm font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.email}</TableCell>
                    <TableCell className="font-body text-sm">{t.phone || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-[#6C6C75]">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="border border-[#E5E5EA]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F7F9]">
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Email</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Role</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[0.2em]">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                    <TableCell className="font-body text-sm font-medium">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] border ${
                        u.role === "admin" ? "bg-red-100 text-red-800 border-red-200" :
                        u.role === "technician" ? "bg-purple-100 text-purple-800 border-purple-200" :
                        "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>{u.role}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#6C6C75]">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quote Dialog */}
      <Dialog open={!!quoteDialog} onOpenChange={() => setQuoteDialog(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-heading">Set Quote &mdash; {quoteDialog?.category_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm text-[#6C6C75] mb-3">{quoteDialog?.issue_description}</p>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Estimated Cost ($)</Label>
              <Input type="number" value={quoteForm.estimated_cost} onChange={e => setQuoteForm(f => ({...f, estimated_cost: e.target.value}))} className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="99.00" data-testid="quote-cost-input" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Breakdown</Label>
              <Textarea value={quoteForm.breakdown} onChange={e => setQuoteForm(f => ({...f, breakdown: e.target.value}))} className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="Parts: $50, Labor: $49" data-testid="quote-breakdown-input" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Notes</Label>
              <Input value={quoteForm.notes} onChange={e => setQuoteForm(f => ({...f, notes: e.target.value}))} className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="Optional notes" data-testid="quote-notes-input" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={handleSetQuote} className="bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors" data-testid="submit-quote-btn">
              Set Quote
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-heading">Assign Technician &mdash; {assignDialog?.category_name}</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Select Technician</Label>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="assign-tech-select">
                <SelectValue placeholder="Choose a technician" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={handleAssign} className="bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors" data-testid="confirm-assign-btn">
              Assign
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-heading">Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Name</Label>
              <Input value={newUser.name} onChange={e => setNewUser(u => ({...u, name: e.target.value}))} className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="new-user-name" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Email</Label>
              <Input value={newUser.email} onChange={e => setNewUser(u => ({...u, email: e.target.value}))} className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="new-user-email" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Password</Label>
              <Input value={newUser.password} onChange={e => setNewUser(u => ({...u, password: e.target.value}))} className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="new-user-password" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Role</Label>
              <Select value={newUser.role} onValueChange={v => setNewUser(u => ({...u, role: v}))}>
                <SelectTrigger className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={handleCreateUser} className="bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors" data-testid="create-user-btn">
              Create User
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
