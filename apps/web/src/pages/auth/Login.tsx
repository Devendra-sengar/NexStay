import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: '🏠', title: 'Manage Multiple PGs', desc: 'All your properties in one dashboard' },
  { icon: '💰', title: 'Rent Tracking', desc: 'Automated rent records & reminders' },
  { icon: '📱', title: 'Student App', desc: 'Mobile app for your tenants' },
  { icon: '📊', title: 'Analytics', desc: 'Real-time occupancy & revenue reports' },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex">
      {/* ── Left: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col justify-between p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-surface-dark to-surface-card" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              Nex<span className="text-brand-primary">Stay</span>
            </span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full px-4 py-1.5 text-xs text-brand-primary font-medium mb-6 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            India's #1 PG Management Platform
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-text-primary leading-tight mb-4">
            Manage your PG<br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">smarter, faster.</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed mb-10">
            From student bookings to rent collection — everything you need to run a modern paying guest business.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-4 rounded-lg hover:border-brand-primary/30 transition-colors duration-200">
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <p className="text-text-primary font-semibold text-sm">{f.title}</p>
                <p className="text-text-muted text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10">
          <div className="glass-card p-4 rounded-xl max-w-sm">
            <p className="text-text-muted text-sm italic">"NexStay reduced our rent collection time by 80%. Game changer!"</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">VP</div>
              <div>
                <p className="text-text-primary text-xs font-medium">Vikram Patel</p>
                <p className="text-text-muted text-xs">Owner, Sunrise Boys PG · Pune</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-surface-card/30" />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
          </div>

          <h2 className="text-3xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-text-muted mb-8">Sign in to your NexStay account</p>

          {/* Quick fill hints */}
          <div className="glass-card rounded-lg p-3 mb-6 text-xs text-text-muted">
            <p className="font-medium text-text-primary mb-1">🧪 Dev credentials:</p>
            <p>Admin: <span className="text-brand-secondary">admin@nexstay.in</span> / Admin@123</p>
            <p>Owner: <span className="text-brand-secondary">owner1@nexstay.in</span> / Owner@123</p>
            <p>Student: <span className="text-brand-secondary">student1@nexstay.in</span> / Student@123</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={cn('input-field', errors.email && 'border-status-error focus:border-status-error focus:ring-status-error/20')}
              />
              {errors.email && <p className="text-status-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn('input-field pr-10', errors.password && 'border-status-error')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-status-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-status-error/10 border border-status-error/30 rounded-md px-4 py-3 text-sm text-status-error">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-primary font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
