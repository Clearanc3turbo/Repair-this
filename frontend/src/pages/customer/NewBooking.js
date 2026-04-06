import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../lib/api";
import { formatApiError } from "../../lib/api";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { toast } from "../../components/ui/sonner";
import { Smartphone, Laptop, Tv, Tablet, Gamepad2, Headphones, Upload, CalendarIcon, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { format } from "date-fns";

const ICONS = { phone: Smartphone, laptop: Laptop, tv: Tv, tablet: Tablet, gaming: Gamepad2, audio: Headphones };
const TIMES = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

export default function NewBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category_id: searchParams.get("category") || "",
    issue_description: "",
    device_brand: "",
    device_model: "",
    address: "",
    preferred_date: "",
    preferred_time: "",
    urgency: "normal",
    photo_ids: [],
  });
  const [photos, setPhotos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    API.get("/services").then(r => setServices(r.data)).catch(console.error);
  }, []);

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const ids = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await API.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        ids.push(data.id);
        setPhotos(prev => [...prev, { id: data.id, name: file.name, path: data.path }]);
      }
      updateForm("photo_ids", [...form.photo_ids, ...ids]);
      toast.success("Photos uploaded");
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    updateForm("preferred_date", format(date, "yyyy-MM-dd"));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await API.post("/bookings", form);
      toast.success("Booking created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 1) return !!form.category_id;
    if (step === 2) return form.issue_description.length > 5;
    if (step === 3) return form.address.length > 3 && form.preferred_date && form.preferred_time;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="new-booking-page">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm font-body text-[#6C6C75] hover:text-[#0F0F13] mb-6 transition-colors" data-testid="back-btn">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F0F13]">New Repair Booking</h1>

      {/* Progress */}
      <div className="flex items-center gap-1 mt-6 mb-10">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 flex items-center gap-1">
            <div className={`h-1 flex-1 ${s <= step ? "bg-[#FF3B30]" : "bg-[#E5E5EA]"} transition-colors`} />
          </div>
        ))}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div data-testid="step-1-category">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-2">Step 1</p>
          <h2 className="font-heading text-xl font-semibold text-[#0F0F13] mb-6">Select Device Type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#E5E5EA] border border-[#E5E5EA]">
            {services.map(s => {
              const Icon = ICONS[s.id] || Smartphone;
              const selected = form.category_id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => updateForm("category_id", s.id)}
                  className={`p-6 text-left transition-colors ${selected ? "bg-[#0F0F13] text-white" : "bg-white hover:bg-[#F7F7F9]"}`}
                  data-testid={`category-btn-${s.id}`}
                >
                  <Icon className={`h-5 w-5 mb-3 ${selected ? "text-[#FF3B30]" : "text-[#6C6C75]"}`} strokeWidth={1.5} />
                  <p className="font-heading text-sm font-semibold">{s.name}</p>
                  <p className={`font-mono text-xs mt-1 ${selected ? "text-[#FF3B30]" : "text-[#6C6C75]"}`}>From ${s.base_price}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Issue Details */}
      {step === 2 && (
        <div data-testid="step-2-details">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-2">Step 2</p>
          <h2 className="font-heading text-xl font-semibold text-[#0F0F13] mb-6">Describe the Issue</h2>
          <div className="space-y-5">
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Issue Description</Label>
              <Textarea
                value={form.issue_description}
                onChange={e => updateForm("issue_description", e.target.value)}
                placeholder="Describe what's wrong with your device..."
                className="mt-1.5 rounded-none border-[#E5E5EA] min-h-[120px]"
                data-testid="issue-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Brand</Label>
                <Input value={form.device_brand} onChange={e => updateForm("device_brand", e.target.value)} placeholder="e.g. Apple, Samsung" className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="device-brand" />
              </div>
              <div>
                <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Model</Label>
                <Input value={form.device_model} onChange={e => updateForm("device_model", e.target.value)} placeholder="e.g. iPhone 15, Galaxy S24" className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="device-model" />
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Urgency</Label>
              <Select value={form.urgency} onValueChange={v => updateForm("urgency", v)}>
                <SelectTrigger className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="urgency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent (priority scheduling)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Photos of the Issue</Label>
              <div className="mt-1.5 border border-dashed border-[#E5E5EA] p-6 text-center hover:border-[#0F0F13] transition-colors">
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" data-testid="photo-upload-input" />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="h-6 w-6 text-[#6C6C75] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="font-body text-sm text-[#6C6C75]">{uploading ? "Uploading..." : "Click to upload photos"}</p>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="mt-2 space-y-1">
                  {photos.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs font-mono text-[#6C6C75]">
                      <Check className="h-3 w-3 text-[#34C759]" /> {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div data-testid="step-3-schedule">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-2">Step 3</p>
          <h2 className="font-heading text-xl font-semibold text-[#0F0F13] mb-6">Schedule & Location</h2>
          <div className="space-y-5">
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Address</Label>
              <Textarea value={form.address} onChange={e => updateForm("address", e.target.value)} placeholder="Full address for the repair visit" className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="address-input" />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Preferred Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full mt-1.5 flex items-center justify-between border border-[#E5E5EA] px-3 py-2 text-sm text-left hover:border-[#0F0F13] transition-colors" data-testid="date-picker-trigger">
                    {form.preferred_date || "Select a date"}
                    <CalendarIcon className="h-4 w-4 text-[#6C6C75]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    data-testid="booking-calendar"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Preferred Time</Label>
              <Select value={form.preferred_time} onValueChange={v => updateForm("preferred_time", v)}>
                <SelectTrigger className="mt-1.5 rounded-none border-[#E5E5EA]" data-testid="time-select">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div data-testid="step-4-review">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-2">Step 4</p>
          <h2 className="font-heading text-xl font-semibold text-[#0F0F13] mb-6">Review & Submit</h2>
          <div className="border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
            <div className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Category</p>
              <p className="font-heading text-base font-semibold text-[#0F0F13] mt-1">{services.find(s => s.id === form.category_id)?.name}</p>
            </div>
            <div className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Issue</p>
              <p className="font-body text-sm text-[#0F0F13] mt-1">{form.issue_description}</p>
              {form.device_brand && <p className="font-body text-xs text-[#6C6C75] mt-1">{form.device_brand} {form.device_model}</p>}
            </div>
            <div className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Schedule</p>
              <p className="font-body text-sm text-[#0F0F13] mt-1">{form.preferred_date} at {form.preferred_time}</p>
            </div>
            <div className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Address</p>
              <p className="font-body text-sm text-[#0F0F13] mt-1">{form.address}</p>
            </div>
            {photos.length > 0 && (
              <div className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C75]">Photos</p>
                <p className="font-body text-sm text-[#0F0F13] mt-1">{photos.length} photo(s) uploaded</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-sm font-body text-[#6C6C75] hover:text-[#0F0F13] transition-colors" data-testid="prev-step-btn">
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
        ) : <div />}
        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1 bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors disabled:opacity-30"
            data-testid="next-step-btn"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1 bg-[#FF3B30] text-white font-medium px-6 py-2.5 text-sm hover:bg-[#D93025] transition-colors disabled:opacity-50"
            data-testid="submit-booking-btn"
          >
            {submitting ? "Submitting..." : "Submit Booking"}
          </button>
        )}
      </div>
    </div>
  );
}
