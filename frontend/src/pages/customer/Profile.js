import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import API from "../../lib/api";
import { formatApiError } from "../../lib/api";
import { toast } from "../../components/ui/sonner";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from "lucide-react";

export default function Profile() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", default_address: "" });

  useEffect(() => {
    API.get("/profile")
      .then(r => {
        setProfile(r.data);
        setForm({ name: r.data.name, phone: r.data.phone || "", default_address: r.data.default_address || "" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put("/profile", form);
      toast.success("Profile updated!");
      checkAuth();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="profile-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-body text-[#6C6C75] hover:text-[#0F0F13] mb-6 transition-colors" data-testid="profile-back-btn">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F0F13]">My Profile</h1>
      <p className="font-body text-sm text-[#6C6C75] mt-1">Manage your account details</p>

      {/* Read-only info */}
      <div className="mt-8 border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
        <div className="p-5 flex items-center gap-3 bg-[#F7F7F9]">
          <div className="w-12 h-12 bg-white border border-[#E5E5EA] flex items-center justify-center">
            <User className="h-5 w-5 text-[#6C6C75]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-[#0F0F13]">{profile?.name}</p>
            <p className="font-mono text-xs text-[#6C6C75]">{profile?.role?.toUpperCase()} account</p>
          </div>
        </div>
        <div className="p-5 flex items-center gap-3">
          <Mail className="h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Email</p>
            <p className="font-body text-sm text-[#0F0F13]">{profile?.email}</p>
          </div>
        </div>
        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Member Since</p>
          <p className="font-body text-sm text-[#0F0F13] mt-0.5">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="mt-8 space-y-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30]">Edit Details</p>

        <div>
          <Label htmlFor="name" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Full Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="mt-1.5 rounded-none border-[#E5E5EA] focus:border-[#0F0F13] focus:ring-0"
            data-testid="profile-name-input"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Phone Number</Label>
          <div className="relative mt-1.5">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
            <Input
              id="phone"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="pl-10 rounded-none border-[#E5E5EA] focus:border-[#0F0F13] focus:ring-0"
              placeholder="+1 (555) 000-0000"
              data-testid="profile-phone-input"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Default Address</Label>
          <div className="relative mt-1.5">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-[#6C6C75]" strokeWidth={1.5} />
            <Textarea
              id="address"
              value={form.default_address}
              onChange={e => setForm(f => ({ ...f, default_address: e.target.value }))}
              className="pl-10 rounded-none border-[#E5E5EA] focus:border-[#0F0F13] focus:ring-0 min-h-[80px]"
              placeholder="Your default address for repair visits"
              data-testid="profile-address-input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#FF3B30] text-white font-medium px-6 py-3 hover:bg-[#D93025] transition-colors disabled:opacity-50"
          data-testid="profile-save-btn"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
