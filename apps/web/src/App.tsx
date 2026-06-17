import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@nexstay/shared';
import { Toaster } from 'react-hot-toast';

// Auth pages
import LoginPage from '@/pages/auth/Login';
import SignupPage from '@/pages/auth/Signup';
import OtpVerificationPage from '@/pages/auth/OtpVerification';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';

// App shells
import OwnerShell from '@/layouts/OwnerShell';
import AdminShell from '@/layouts/AdminShell';
import StudentShell from '@/layouts/StudentShell';

// Dev
import ComponentsPage from '@/pages/dev/Components';

// Loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-surface-dark flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-surface-border border-t-brand-primary animate-spin" />
      <p className="text-text-muted text-sm">Loading NexStay...</p>
    </div>
  </div>
);

// Role-based redirect
const RoleRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === Role.SUPER_ADMIN) return <Navigate to="/admin/dashboard" replace />;
  if (user.role === Role.PG_OWNER || user.role === Role.PROPERTY_MANAGER) return <Navigate to="/erp/dashboard" replace />;
  return <Navigate to="/app/home" replace />;
};

function App() {
  const { isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#171717', color: '#f5f5f5', border: '1px solid #262626' } }} />
      <Routes>
        {/* ── Auth routes ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ── Role-based redirect ── */}
        <Route path="/" element={<RoleRouter />} />

        {/* ── Owner / Manager ERP ── */}
        <Route path="/erp/*" element={<OwnerShell />} />

        {/* ── Admin Panel ── */}
        <Route path="/admin/*" element={<AdminShell />} />

        {/* ── Student App ── */}
        <Route path="/app/*" element={<StudentShell />} />

        {/* ── Dev ── */}
        <Route path="/dev/components" element={<ComponentsPage />} />

        {/* ── 404 ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
