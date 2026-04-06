import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import API from "../../lib/api";
import { toast } from "../../components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Wrench, Clock, MapPin, User, ChevronRight, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  assigned: { label: "ASSIGNED", color: "bg-purple-100 text-purple-800 border-purple-200", next: "on_the_way" },
  on_the_way: { label: "ON THE WAY", color: "bg-cyan-100 text-cyan-800 border-cyan-200", next: "in_progress" },
  in_progress: { label: "IN PROGRESS", color: "bg-orange-100 text-orange-800 border-orange-200", next: "completed" },
  completed: { label: "COMPLETED", color: "bg-emerald-100 text-emerald-800 border-emerald-200", next: null },
  pending: { label: "PENDING", color: "bg-amber-100 text-amber-800 border-amber-200", next: null },
  quoted: { label: "QUOTED", color: "bg-blue-100 text-blue-800 border-blue-200", next: null },
  approved: { label: "APPROVED", color: "bg-indigo-100 text-indigo-800 border-indigo-200", next: null },
  cancelled: { label: "CANCELLED", color: "bg-red-100 text-red-800 border-red-200", next: null },
};

const STATUS_LABELS = {
  on_the_way: "On The Way",
  in_progress: "Start Repair",
  completed: "Mark Complete",
};

export default function TechDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchJobs = () => {
    API.get("/technician/jobs").then(r => setJobs(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const activeJobs = jobs.filter(j => !["completed", "cancelled"].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === "completed");

  const handleStatusUpdate = async (job, newStatus) => {
    setUpdating(true);
    try {
      await API.put(`/technician/jobs/${job.id}/status`, { status: newStatus, notes: noteText || undefined });
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      setNoteText("");
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (jobId) => {
    if (!noteText.trim()) return;
    try {
      await API.post(`/technician/jobs/${jobId}/notes`, {
        notes: noteText,
        final_cost: finalCost ? parseFloat(finalCost) : undefined
      });
      toast.success("Note added");
      setNoteText("");
      setFinalCost("");
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" data-testid="tech-dashboard">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F0F13]">My Jobs</h1>
        <p className="font-body text-sm text-[#6C6C75] mt-1">Welcome, {user?.name}. You have {activeJobs.length} active job(s).</p>
      </div>

      {activeJobs.length === 0 && (
        <div className="text-center py-16 border border-[#E5E5EA] bg-[#F7F7F9] mb-8">
          <AlertCircle className="h-10 w-10 text-[#E5E5EA] mx-auto mb-3" />
          <p className="font-body text-[#6C6C75]">No active jobs assigned to you</p>
        </div>
      )}

      {activeJobs.length > 0 && (
        <div className="space-y-3 mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30]">Active Jobs</p>
          {activeJobs.map(job => {
            const cfg = STATUS_CONFIG[job.status];
            const nextStatus = cfg?.next;
            return (
              <div key={job.id} className="border border-[#E5E5EA] bg-white" data-testid={`tech-job-${job.id}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-heading text-base font-semibold text-[#0F0F13]">{job.category_name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] border ${cfg?.color}`}>{cfg?.label}</span>
                      </div>
                      <p className="font-body text-sm text-[#6C6C75]">{job.issue_description}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs font-mono text-[#6C6C75]">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{job.customer_name}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.preferred_date} {job.preferred_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusUpdate(job, nextStatus)}
                        className="bg-[#FF3B30] text-white font-medium px-5 py-2 text-sm hover:bg-[#D93025] transition-colors"
                        data-testid={`status-btn-${nextStatus}`}
                      >
                        {STATUS_LABELS[nextStatus] || nextStatus}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="bg-white text-[#0F0F13] font-medium px-5 py-2 text-sm border border-[#E5E5EA] hover:border-[#0F0F13] transition-all"
                      data-testid={`add-note-btn-${job.id}`}
                    >
                      Add Note
                    </button>
                  </div>
                </div>
                {job.technician_notes?.length > 0 && (
                  <div className="border-t border-[#E5E5EA] p-4 bg-[#F7F7F9]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75] mb-2">Notes</p>
                    {job.technician_notes.slice(-3).map((n, i) => (
                      <div key={i} className="text-sm font-body text-[#0F0F13] border-l-2 border-[#E5E5EA] pl-3 mb-2">
                        <p>{n.text}</p>
                        <p className="text-[10px] font-mono text-[#6C6C75]">{new Date(n.at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75] mb-3">Completed Jobs ({completedJobs.length})</p>
          <div className="space-y-2">
            {completedJobs.slice(0, 10).map(job => (
              <div key={job.id} className="border border-[#E5E5EA] p-4 bg-[#F7F7F9] flex items-center justify-between" data-testid={`completed-job-${job.id}`}>
                <div>
                  <p className="font-heading text-sm font-semibold text-[#0F0F13]">{job.category_name}</p>
                  <p className="text-xs font-mono text-[#6C6C75]">{job.customer_name} &middot; {job.preferred_date}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] border bg-emerald-100 text-emerald-800 border-emerald-200">COMPLETED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Note for {selectedJob?.category_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Note</Label>
              <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Repair notes, findings, parts used..." className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="note-textarea" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Final Cost (optional)</Label>
              <Input type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} placeholder="0.00" className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="final-cost-input" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => selectedJob && handleAddNote(selectedJob.id)} className="bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors" data-testid="save-note-btn">
              Save Note
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
