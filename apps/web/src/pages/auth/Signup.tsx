import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowRight, Loader2, CheckCircle2, Home, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().length(10, 'Phone number must be exactly 10 digits').regex(/^\d{10}$/, 'Must contain only numbers'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'GUEST',
      };
      const res = await api.post('/auth/register', payload);
      navigate('/verify-otp', { state: { email: data.email, otp: res.data.otp, role: 'GUEST' } });
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden flex-col justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/15 via-surface-dark to-surface-card" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-brand-secondary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
            Find your perfect<br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">PG or hostel</span>
          </h1>
          <p className="text-text-muted text-base mb-10">Create your free student account and discover verified accommodations near you.</p>
          {[
            'Browse 1000+ verified hostels & PGs',
            'Real-time room availability',
            'Direct booking & instant confirmation',
            'Mess & cafeteria info included',
          ].map((b) => (
            <div key={b} className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
              <span className="text-text-muted text-sm">{b}</span>
            </div>
          ))}

          {/* Owner info box */}
          <div className="mt-8 p-4 rounded-xl border border-surface-border bg-surface-card/50">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-semibold text-text-primary">Are you a hostel owner?</span>
            </div>
            <p className="text-xs text-text-muted pl-6">
              Owner accounts are set up by our platform team. Contact <strong>support@nexstay.in</strong> to get registered.
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-8">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5 text-brand-primary" />
            <h2 className="text-2xl font-bold text-text-primary">Student Sign Up</h2>
          </div>
          <p className="text-text-muted mb-6">Find and book your perfect PG / hostel</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
                <input {...register('name')} placeholder="Arjun Kumar" className={cn('input-field', errors.name && 'border-status-error')} />
                {errors.name && <p className="text-status-error text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
                <input {...register('phone')} placeholder="9876543210" className={cn('input-field', errors.phone && 'border-status-error')} maxLength={10} inputMode="numeric" />
                {errors.phone && <p className="text-status-error text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className={cn('input-field', errors.email && 'border-status-error')} />
              {errors.email && <p className="text-status-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
                <input {...register('password')} type="password" placeholder="••••••••" className={cn('input-field', errors.password && 'border-status-error')} />
                {errors.password && <p className="text-status-error text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm</label>
                <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={cn('input-field', errors.confirmPassword && 'border-status-error')} />
                {errors.confirmPassword && <p className="text-status-error text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {serverError && <div className="bg-status-error/10 border border-status-error/30 rounded-md px-4 py-3 text-sm text-status-error">{serverError}</div>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-4">
            Already have an account? <Link to="/login" className="text-brand-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
