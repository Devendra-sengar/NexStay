import { useState } from 'react';
import { X, Calendar, User, Phone, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface ScheduleVisitModalProps {
  propertyId: string;
  propertyName: string;
  onClose: () => void;
}

export default function ScheduleVisitModal({ propertyId, propertyName, onClose }: ScheduleVisitModalProps) {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '10:00' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/public/visit-requests', {
        propertyId,
        name: form.name,
        phone: form.phone,
        preferredDate: form.date,
        preferredTime: form.time,
      });
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Schedule a Visit</h2>
            <p className="text-xs text-slate-500 truncate max-w-xs">{propertyName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <h3 className="text-lg font-bold text-slate-900">Visit Scheduled!</h3>
              <p className="text-slate-500 text-sm">We'll contact you shortly on <strong>{form.phone}</strong> to confirm your visit.</p>
              <button onClick={onClose} className="mt-3 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit mobile"
                    type="tel"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" min={today} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
                  <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                    {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Submitting…' : 'Request Visit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
