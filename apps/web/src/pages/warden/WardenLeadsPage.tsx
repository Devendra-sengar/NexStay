import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Plus, Search, X, Loader2, Phone, Mail, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  VISITED: 'bg-purple-100 text-purple-700 border-purple-200',
  CONVERTED: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
};

// Hooks
function useWardenLeads(search?: string) {
  return useQuery({
    queryKey: ['warden-leads', { search }],
    queryFn: async () => {
      const { data } = await api('/warden/leads', { params: { search } });
      return data.data as any[];
    }
  });
}

function useCreateWardenLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api('/warden/leads', { method: 'POST', data: body });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warden-leads'] })
  });
}

function useUpdateWardenLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api(`/warden/leads/${id}/status`, { method: 'PATCH', data: { status } });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warden-leads'] })
  });
}

export default function WardenLeadsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data: leads, isLoading } = useWardenLeads(search);
  const updateStatus = useUpdateWardenLeadStatus();

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Enquiries</h1>
          <p className="text-sm text-text-muted mt-1">Manage walk-ins and leads for your hostel</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Enquiry
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search name, phone, email..."
          className="input-field pl-9 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 text-text-muted border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 font-medium">Lead Details</th>
                <th className="px-4 py-3 font-medium">Submitted By</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading enquiries...
                  </td>
                </tr>
              ) : leads?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-text-muted">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                leads?.map((lead) => (
                  <tr key={lead._id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-text-primary">{lead.name}</div>
                      <div className="flex items-center gap-2 text-text-secondary text-xs mt-1">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2 text-text-secondary text-xs mt-0.5">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="text-[10px] text-text-muted bg-surface-border/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                          {lead.source}
                        </div>
                        {lead.roomType && (
                          <div className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                            {lead.roomType}
                          </div>
                        )}
                        {lead.messIncluded && (
                          <div className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                            Mess Included
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-text-primary">
                        <UserCircle className="w-4 h-4 text-text-muted" />
                        {lead.submittedBy?.name}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {lead.submittedByRole === 'HOSTEL_ADMIN' ? 'Owner' : 'Warden'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-muted">
                      {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className={cn(
                          'text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer',
                          STATUS_COLORS[lead.status]
                        )}
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="VISITED">Visited</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WardenLeadModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

function WardenLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'WALK_IN', roomType: '', messIncluded: false, notes: '' });
  const createLead = useCreateWardenLead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead.mutateAsync({ ...form });
      toast.success('Enquiry added successfully');
      onClose();
      setForm({ name: '', phone: '', email: '', source: 'WALK_IN', roomType: '', messIncluded: false, notes: '' });
    } catch {
      toast.error('Failed to add enquiry');
    }
  };

  if (!open) return null;

  return (
    <div className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
          <div className="flex justify-between items-center p-5 border-b border-surface-border">
            <h2 className="text-lg font-bold text-text-primary">Add Walk-in Enquiry</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input type="text" required className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Phone *</label>
                <input type="tel" required className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Source</label>
                <select className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Room Preference</label>
                <select className="input-field" value={form.roomType} onChange={e => setForm({ ...form, roomType: e.target.value })}>
                  <option value="">Any / Not sure</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Double Room">Double Room (2 Sharing)</option>
                  <option value="Triple Room">Triple Room (3 Sharing)</option>
                  <option value="Dormitory">Dormitory</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="messIncluded" checked={form.messIncluded} onChange={e => setForm({ ...form, messIncluded: e.target.checked })} className="w-4 h-4 cursor-pointer" />
              <label htmlFor="messIncluded" className="text-sm font-medium text-text-primary cursor-pointer">Mess Included</label>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="input-field resize-none h-20" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific requirements..." />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={createLead.isPending} className="btn-primary w-full flex justify-center">
                {createLead.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Enquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
