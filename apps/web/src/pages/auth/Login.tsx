import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@nexstay/shared';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const DEV_CREDS = [
  { label: 'Super Admin', email: 'superadmin@nexstay.in', pw: 'SuperAdmin@123', color: 'text-indigo' },
  { label: 'Owner 1 (Pune)', email: 'owner1@nexstay.in', pw: 'Owner@123', color: 'text-primary' },
  { label: 'Guest / Student', email: 'student1@nexstay.in', pw: 'Student@123', color: 'text-success' },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '';

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (returnUrl) { navigate(returnUrl); return; }
      if (user.role === Role.HOSTEL_ADMIN) navigate('/admin/dashboard');
      else if (user.role === Role.SUPER_ADMIN) navigate('/superadmin/dashboard');
      else navigate('/account/bookings');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary to-primary-dark flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">NexStay</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            India's #1<br />PG & Hostel<br />Platform
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            Find verified PGs or manage your hostel — all in one place.
          </p>
          <div className="bg-white/10 rounded-xl p-4 max-w-sm">
            <p className="text-blue-100 text-sm italic">"NexStay reduced our rent collection time by 80%. Game changer!"</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">VP</div>
              <div>
                <p className="text-white text-xs font-medium">Vikram Patel</p>
                <p className="text-blue-200 text-xs">Owner, Sunrise Boys PG · Pune</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-blue-100 text-sm">
          <span>🏠 500+ PGs</span>
          <span>⭐ 4.5 Rating</span>
          <span>✅ Verified</span>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">Nex<span className="text-primary">Stay</span></span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-text-secondary text-sm mb-6">Sign in to your NexStay account</p>

          {/* Dev credentials */}
          <div className="card p-3 mb-6 bg-surface border border-surface-border">
            <p className="text-xs font-semibold text-text-secondary mb-2">🧪 Dev Credentials (click to fill):</p>
            <div className="space-y-1">
              {DEV_CREDS.map(c => (
                <button key={c.email} type="button" onClick={() => { setValue('email', c.email); setValue('password', c.pw); }}
                  className="w-full text-left text-xs hover:bg-primary/5 rounded px-2 py-1 transition-colors flex items-center justify-between">
                  <span className={`font-medium ${c.color}`}>{c.label}</span>
                  <span className="text-text-muted">{c.email}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com"
                className={cn('input-field', errors.email && 'border-danger focus:border-danger focus:ring-danger/20')} />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  className={cn('input-field pr-10', errors.password && 'border-danger')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-danger-light border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger">{serverError}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Create account</Link>
          </p>
          <p className="text-center text-text-muted text-xs mt-3">
            <Link to="/" className="hover:text-primary transition-colors">← Back to marketplace</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
