import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatApiError } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Wrench } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ name, email, password, phone, role: "customer" });
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex" data-testid="register-page">
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F0F13] items-center justify-center relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1733741020205-1ed0208314b6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBzbWFydHBob25lJTIwY2lyY3VpdCUyMGJvYXJkfGVufDB8fHx8MTc3NTUwMjgwN3ww&ixlib=rb-4.1.0&q=85"
          alt="Circuit"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 p-12">
          <Wrench className="h-8 w-8 text-[#FF3B30] mb-6" strokeWidth={1.5} />
          <h2 className="font-heading text-3xl font-bold text-white">Join FIXBOOK</h2>
          <p className="font-body text-[#6C6C75] mt-4 max-w-sm">Create an account to book repairs, track progress, and manage all your devices.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Wrench className="h-5 w-5 text-[#FF3B30]" strokeWidth={1.5} />
            <span className="font-heading text-xl font-black tracking-tighter">FIXBOOK</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F0F13]">Create account</h1>
          <p className="font-body text-sm text-[#6C6C75] mt-2">Start booking repairs in minutes</p>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-body" data-testid="register-error">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="name" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="John Doe" data-testid="register-name" />
            </div>
            <div>
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="you@example.com" data-testid="register-email" />
            </div>
            <div>
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="Min 6 characters" data-testid="register-password" />
            </div>
            <div>
              <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-[0.2em] text-[#6C6C75]">Phone (Optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 rounded-none border-[#E5E5EA]" placeholder="+1 (555) 000-0000" data-testid="register-phone" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#FF3B30] text-white font-medium py-3 hover:bg-[#D93025] transition-colors disabled:opacity-50" data-testid="register-submit">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm font-body text-[#6C6C75]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#FF3B30] hover:underline" data-testid="login-link-from-register">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
