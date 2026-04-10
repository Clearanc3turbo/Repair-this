import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import API from "../lib/api";
import { Smartphone, Laptop, Tv, Tablet, Gamepad2, Headphones, ArrowRight, Shield, Clock, BadgeCheck, Star, TrendingUp, Flame } from "lucide-react";

const SERVICES = [
  { id: "phone", name: "Phone Repair", desc: "Screen, battery, charging port", icon: Smartphone, price: "From $49" },
  { id: "laptop", name: "Laptop Repair", desc: "Screen, keyboard, motherboard", icon: Laptop, price: "From $89" },
  { id: "tv", name: "TV Repair", desc: "Backlight, power supply, HDMI", icon: Tv, price: "From $129" },
  { id: "tablet", name: "Tablet Repair", desc: "Screen, battery, software fix", icon: Tablet, price: "From $59" },
  { id: "gaming", name: "Gaming Console", desc: "HDMI, overheating, disc drive", icon: Gamepad2, price: "From $79" },
  { id: "audio", name: "Audio Equipment", desc: "Speakers, headphones, amplifiers", icon: Headphones, price: "From $39" },
];

const STEPS = [
  { num: "01", title: "Choose Service", desc: "Select your device category and describe the issue" },
  { num: "02", title: "Get a Quote", desc: "Receive an expert estimate before any work begins" },
  { num: "03", title: "We Fix It", desc: "A verified technician handles your repair" },
  { num: "04", title: "Pay After", desc: "Only pay when the job is done to your satisfaction" },
];

export default function Landing() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    API.get("/reviews").then(r => setReviews(r.data.slice(0, 6))).catch(() => {});
    API.get("/popular-services").then(r => setPopular(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1630588562940-949455f18324?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBzbWFydHBob25lJTIwY2lyY3VpdCUyMGJvYXJkfGVufDB8fHx8MTc3NTUwMjgwN3ww&ixlib=rb-4.1.0&q=85"
            alt="Circuit board"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/80" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-32 md:py-44">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-6" data-testid="hero-label">Electronics Repair Experts</p>
            <h1 className="font-heading text-5xl sm:text-6xl tracking-tighter font-black text-[#0F0F13] leading-[0.95]" data-testid="hero-title">
              Precision repairs.<br />Fair prices.<br />Done right.
            </h1>
            <p className="font-body text-base text-[#6C6C75] mt-8 max-w-md leading-relaxed">
              Book verified technicians for your phone, laptop, TV, and more. Get a quote first, pay only after the job is complete.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                to={user ? "/dashboard/new-booking" : "/register"}
                className="inline-flex items-center gap-2 bg-[#FF3B30] text-white font-medium px-8 py-4 hover:bg-[#D93025] transition-colors"
                data-testid="hero-cta"
              >
                Book a Repair <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#services"
                className="inline-flex items-center gap-2 bg-[#F7F7F9] text-[#0F0F13] font-medium px-8 py-4 border border-[#E5E5EA] hover:border-[#0F0F13] transition-all"
                data-testid="hero-secondary-cta"
              >
                View Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-[#E5E5EA] bg-[#F7F7F9]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-2 text-sm font-body text-[#6C6C75]">
            <Shield className="h-4 w-4 text-[#34C759]" strokeWidth={1.5} />
            <span>90-Day Warranty</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-body text-[#6C6C75]">
            <BadgeCheck className="h-4 w-4 text-[#007AFF]" strokeWidth={1.5} />
            <span>Verified Technicians</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-body text-[#6C6C75]">
            <Clock className="h-4 w-4 text-[#FF3B30]" strokeWidth={1.5} />
            <span>Same-Day Service Available</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 md:px-12 lg:px-24" data-testid="services-section">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-4">What We Fix</p>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight font-bold text-[#0F0F13]">Repair Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E5E5EA] mt-12 border border-[#E5E5EA]">
            {SERVICES.map((s) => (
              <Link
                to={user ? `/dashboard/new-booking?category=${s.id}` : `/register`}
                key={s.id}
                className="group bg-white p-8 hover:bg-[#F7F7F9] transition-colors"
                data-testid={`service-card-${s.id}`}
              >
                <s.icon className="h-6 w-6 text-[#0F0F13] mb-4 group-hover:text-[#FF3B30] transition-colors" strokeWidth={1.5} />
                <h3 className="font-heading text-lg font-semibold text-[#0F0F13]">{s.name}</h3>
                <p className="font-body text-sm text-[#6C6C75] mt-1">{s.desc}</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mt-4">{s.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 lg:px-24 bg-[#F7F7F9] border-y border-[#E5E5EA]" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-4">Process</p>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight font-bold text-[#0F0F13]">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {STEPS.map((s) => (
              <div key={s.num} className="relative" data-testid={`step-${s.num}`}>
                <span className="font-mono text-5xl font-black text-[#E5E5EA]">{s.num}</span>
                <h3 className="font-heading text-lg font-semibold text-[#0F0F13] mt-2">{s.title}</h3>
                <p className="font-body text-sm text-[#6C6C75] mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Most Popular Repairs */}
      {popular.length > 0 && (
        <section className="py-20 px-6 md:px-12 lg:px-24" data-testid="popular-repairs-section">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#FF3B30] flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30]">Trending Now</p>
                <h2 className="font-heading text-2xl sm:text-3xl tracking-tight font-bold text-[#0F0F13]">Most Popular Repairs</h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
              {popular.map((p, i) => {
                const IconMap = { phone: Smartphone, laptop: Laptop, tv: Tv, tablet: Tablet, gaming: Gamepad2, audio: Headphones };
                const Icon = IconMap[p.category_id] || Smartphone;
                return (
                  <Link
                    key={p.category_id}
                    to={user ? `/dashboard/new-booking?category=${p.category_id}` : "/register"}
                    className="flex-shrink-0 w-56 border border-[#E5E5EA] bg-white p-5 hover:bg-[#F7F7F9] transition-colors group relative overflow-hidden"
                    data-testid={`popular-card-${p.category_id}`}
                  >
                    <div className="absolute top-3 right-3 bg-[#0F0F13] text-white font-mono text-[10px] px-2 py-0.5 uppercase tracking-[0.15em]">
                      #{i + 1}
                    </div>
                    <Icon className="h-5 w-5 text-[#0F0F13] group-hover:text-[#FF3B30] transition-colors mb-3" strokeWidth={1.5} />
                    <h3 className="font-heading text-sm font-semibold text-[#0F0F13]">{p.category_name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs font-mono text-[#6C6C75]">
                        <TrendingUp className="h-3 w-3" /> {p.booking_count} booked
                      </span>
                      {p.avg_rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-mono text-[#6C6C75]">
                          <Star className="h-3 w-3 text-[#FFCC00] fill-[#FFCC00]" /> {p.avg_rating}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Technician Image Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24" data-testid="tech-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1769763227060-726b7b926bf2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwzfHxlbGVjdHJvbmljcyUyMHJlcGFpciUyMHRlY2huaWNpYW58ZW58MHx8fHwxNzc1NTAyODA2fDA&ixlib=rb-4.1.0&q=85"
              alt="Technician at work"
              className="w-full aspect-[4/5] object-cover border border-[#E5E5EA]"
            />
          </div>
          <div className="md:col-span-7">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-4">Why FixBook</p>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight font-bold text-[#0F0F13]">Expert technicians you can trust</h2>
            <p className="font-body text-base text-[#6C6C75] mt-6 leading-relaxed">
              Every technician on our team is background-checked, certified, and carries a 90-day repair warranty. We believe in transparent pricing &mdash; you get a detailed quote before any work starts, and you only pay after you&rsquo;re satisfied.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-10">
              <div className="border-l-2 border-[#FF3B30] pl-4">
                <p className="font-heading text-2xl font-bold text-[#0F0F13]">500+</p>
                <p className="font-body text-sm text-[#6C6C75]">Repairs completed</p>
              </div>
              <div className="border-l-2 border-[#FF3B30] pl-4">
                <p className="font-heading text-2xl font-bold text-[#0F0F13]">98%</p>
                <p className="font-body text-sm text-[#6C6C75]">Customer satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-[#E5E5EA]" data-testid="reviews-section">
          <div className="max-w-7xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3B30] mb-4">Testimonials</p>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight font-bold text-[#0F0F13]">What Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E5E5EA] mt-12 border border-[#E5E5EA]">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white p-6" data-testid={`review-${r.id}`}>
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "text-[#FFCC00] fill-[#FFCC00]" : "text-[#E5E5EA]"}`} strokeWidth={1.5} />
                    ))}
                  </div>
                  {r.comment && <p className="font-body text-sm text-[#0F0F13] mb-3 leading-relaxed">{r.comment}</p>}
                  <div className="flex items-center justify-between">
                    <p className="font-heading text-sm font-semibold text-[#0F0F13]">{r.customer_name}</p>
                    <p className="font-mono text-[10px] text-[#6C6C75]">{r.category_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-[#E5E5EA] bg-[#0F0F13] py-24 px-6 md:px-12 lg:px-24" data-testid="cta-section">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight font-bold text-white">Ready to get your device fixed?</h2>
          <p className="font-body text-base text-[#6C6C75] mt-4">Book a repair in under 2 minutes. No commitment until you approve the quote.</p>
          <Link
            to={user ? "/dashboard/new-booking" : "/register"}
            className="inline-flex items-center gap-2 bg-[#FF3B30] text-white font-medium px-8 py-4 mt-8 hover:bg-[#D93025] transition-colors"
            data-testid="cta-book"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5EA] py-8 px-6 md:px-12" data-testid="footer">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs text-[#6C6C75]">&copy; 2026 FIXBOOK. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/login" className="font-body text-xs text-[#6C6C75] hover:text-[#0F0F13] transition-colors">Login</Link>
            <Link to="/register" className="font-body text-xs text-[#6C6C75] hover:text-[#0F0F13] transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
