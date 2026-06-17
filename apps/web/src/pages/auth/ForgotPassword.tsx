import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const emailSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit OTP'),
  newPassword: z.string().min(6),
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [serverError, setServerError] = useState('');

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const sendOtp = async (data: EmailForm) => {
    setServerError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setDevOtp(res.data.otp || '');
      setStep('reset');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Failed to send OTP');
    }
  };

  const resetPassword = async (data: ResetForm) => {
    setServerError('');
    try {
      await api.post('/auth/reset-password', { email, otp: data.otp, newPassword: data.newPassword });
      setStep('done');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
        </div>

        <div className="glass-card rounded-xl p-8 shadow-card">
          {step === 'email' && (
            <>
              <h2 className="text-2xl font-bold text-text-primary mb-1">Forgot password?</h2>
              <p className="text-text-muted text-sm mb-6">Enter your email and we'll send you a reset OTP</p>
              <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
                  <input {...emailForm.register('email')} type="email" placeholder="you@example.com"
                    className={cn('input-field', emailForm.formState.errors.email && 'border-status-error')} />
                  {emailForm.formState.errors.email && <p className="text-status-error text-xs mt-1">{emailForm.formState.errors.email.message}</p>}
                </div>
                {serverError && <p className="text-status-error text-sm">{serverError}</p>}
                <button type="submit" disabled={emailForm.formState.isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {emailForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h2 className="text-2xl font-bold text-text-primary mb-1">Reset password</h2>
              <p className="text-text-muted text-sm mb-2">Enter the OTP sent to <span className="text-text-primary">{email}</span></p>
              {devOtp && <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-md px-3 py-2 text-xs text-brand-primary mb-4">🧪 Dev OTP: <span className="font-bold">{devOtp}</span></div>}
              <form onSubmit={resetForm.handleSubmit(resetPassword)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">OTP</label>
                  <input {...resetForm.register('otp')} placeholder="123456" maxLength={6} className={cn('input-field tracking-widest text-center text-lg', resetForm.formState.errors.otp && 'border-status-error')} />
                  {resetForm.formState.errors.otp && <p className="text-status-error text-xs mt-1">{resetForm.formState.errors.otp.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">New password</label>
                  <input {...resetForm.register('newPassword')} type="password" placeholder="••••••••" className={cn('input-field', resetForm.formState.errors.newPassword && 'border-status-error')} />
                  {resetForm.formState.errors.newPassword && <p className="text-status-error text-xs mt-1">{resetForm.formState.errors.newPassword.message}</p>}
                </div>
                {serverError && <p className="text-status-error text-sm">{serverError}</p>}
                <button type="submit" disabled={resetForm.formState.isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {resetForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Password reset!</h2>
              <p className="text-text-muted text-sm mb-6">You can now sign in with your new password</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">Go to login <ArrowRight className="w-4 h-4" /></Link>
            </div>
          )}
        </div>

        <p className="text-center text-text-muted text-sm mt-4">
          <Link to="/login" className="text-brand-primary hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
