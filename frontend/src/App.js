import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatWidget from "./components/ChatWidget";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/customer/Dashboard";
import NewBooking from "./pages/customer/NewBooking";
import BookingDetail from "./pages/customer/BookingDetail";
import TechDashboard from "./pages/technician/TechDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

function AppLayout({ children, showHeader = true }) {
  return (
    <div className="min-h-screen bg-white">
      {showHeader && <Header />}
      {children}
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<AppLayout><Landing /></AppLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={["customer"]}>
              <AppLayout><CustomerDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/new-booking" element={
            <ProtectedRoute roles={["customer"]}>
              <AppLayout><NewBooking /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/booking/:id" element={
            <ProtectedRoute roles={["customer"]}>
              <AppLayout><BookingDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/technician" element={
            <ProtectedRoute roles={["technician"]}>
              <AppLayout><TechDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={["admin"]}>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
