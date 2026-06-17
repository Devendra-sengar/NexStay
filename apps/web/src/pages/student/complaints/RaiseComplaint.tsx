import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, UtensilsCrossed, Wifi, Droplets, Sparkles,
  CheckCircle2, Loader2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useRaiseComplaint } from '@/hooks/useComplaints';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'ELECTRICITY', label: 'Electricity', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  { value: 'FOOD',        label: 'Food',        icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  { value: 'INTERNET',   label: 'Internet',     icon: Wifi, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  { value: 'WATER',      label: 'Water',        icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' },
  { value: 'CLEANING',   label: 'Cleaning',     icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
];

export default function RaiseComplaintPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useRaiseComplaint();

  const handleSubmit = async () => {
    setError('');
    if (!category) { setError('Please select a category'); return; }
    if (!title.trim()) { setError('Please enter a title'); return; }
    if (description.trim().length < 10) { setError('Description must be at least 10 characters'); return; }

    try {
      await mutation.mutateAsync({ title: title.trim(), description: description.trim(), category });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to raise complaint');
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-status-success/15 flex items-center justify-center mb-5 animate-bounce-in">
          <CheckCircle2 className="w-10 h-10 text-status-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Complaint Raised!</h2>
        <p className="text-text-muted text-sm max-w-xs mb-6">
          Your complaint has been submitted. The property manager will review it shortly.
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => navigate('/app/complaints')} className="btn-primary flex-1">
            View My Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/app/complaints')} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Raise a Complaint</h1>
          <p className="text-text-faint text-xs">We'll notify your property manager</p>
        </div>
      </div>

      {/* Category picker */}
      <div className="mb-5">
        <p className="text-text-primary text-sm font-semibold mb-3">What's the issue?</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon, color, bg, border }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                category === value
                  ? `${bg} ${border} scale-[0.97]`
                  : 'border-surface-border bg-surface-dark hover:border-surface-border/80'
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <span className={cn('text-[11px] font-semibold', category === value ? color : 'text-text-muted')}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-text-primary mb-2">Title *</label>
        <input
          className="input-field w-full"
          placeholder="e.g. No electricity in room since morning"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
        />
        <p className="text-text-faint text-xs mt-1 text-right">{title.length}/100</p>
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-text-primary mb-2">Description *</label>
        <textarea
          className="input-field w-full resize-none"
          rows={4}
          placeholder="Describe the issue in detail — when it started, affected area, etc."
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={500}
        />
        <p className="text-text-faint text-xs mt-1 text-right">{description.length}/500</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/30 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0" />
          <p className="text-status-error text-sm">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
      >
        {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        Submit Complaint
      </button>
    </div>
  );
}
