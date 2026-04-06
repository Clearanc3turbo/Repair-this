import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Wrench, User, LogOut, LayoutDashboard, ChevronDown, UserCog } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "technician") return "/technician";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#E5E5EA]" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <Wrench className="h-5 w-5 text-[#FF3B30]" strokeWidth={1.5} />
          <span className="font-heading text-xl font-black tracking-tighter text-[#0F0F13]">FIXBOOK</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/#services" className="text-sm font-body text-[#6C6C75] hover:text-[#0F0F13] transition-colors" data-testid="nav-services">Services</Link>
          <Link to="/#how-it-works" className="text-sm font-body text-[#6C6C75] hover:text-[#0F0F13] transition-colors" data-testid="nav-how-it-works">How It Works</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-body text-[#0F0F13] hover:text-[#FF3B30] transition-colors" data-testid="user-menu-trigger">
                  <div className="w-8 h-8 bg-[#F7F7F9] border border-[#E5E5EA] flex items-center justify-center">
                    <User className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <span className="hidden sm:inline">{user.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-none border-[#E5E5EA]">
                <DropdownMenuItem onClick={() => navigate(getDashboardLink())} className="cursor-pointer" data-testid="menu-dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer" data-testid="menu-profile">
                  <UserCog className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#FF3B30]" data-testid="menu-logout">
                  <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="text-sm font-body text-[#0F0F13] hover:text-[#FF3B30] transition-colors" data-testid="login-link">Login</Link>
              <Link to="/register" className="bg-[#FF3B30] text-white font-medium px-5 py-2 text-sm hover:bg-[#D93025] transition-colors" data-testid="register-link">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
