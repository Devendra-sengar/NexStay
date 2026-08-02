import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePreBooking, useAdminProperties } from '@/lib/adminApi';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatePreBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWarden = user?.role === 'WARDEN';
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data || [];

  const [propId, setPropId] = useState(properties.length === 1 ? properties[0]._id : '');
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', preferredRoomType: '',
    expectedJoiningDate: '', tokenAmount: '', tokenPaymentMethod: 'CASH',
    college: '', guardianName: '', guardianPhone: '', guardianAddress: ''
  });
  
  const createPreBooking = useCreatePreBooking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propId) return toast.error('Please select a property');
    if (!formData.name || !formData.phone || !formData.preferredRoomType || !formData.expectedJoiningDate || !formData.tokenAmount) {
      return toast.error('Please fill all required fields');
    }

    try {
      await createPreBooking.mutateAsync({
        propertyId: propId,
        ...formData,
        tokenAmount: Number(formData.tokenAmount)
      });
      toast.success('Future booking created successfully');
      navigate(isWarden ? '/warden/pre-bookings' : '/admin/pre-bookings');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6 pb-32">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Create Future Booking</h1>
          <p className="text-sm text-text-muted mt-1">Record a token payment for a future tenant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-surface-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
            <h2 className="text-lg font-bold text-text-primary">Booking Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.length > 1 && (
              <div className="md:col-span-2">
                <label className="form-label">Property <span className="text-red-500">*</span></label>
                <select className="input-field" value={propId} onChange={e => setPropId(e.target.value)} required>
                  <option value="">Select Property...</option>
                  {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}
            
            <div>
              <label className="form-label">Expected Joining Date <span className="text-red-500">*</span></label>
              <input type="date" className="input-field" required
                value={formData.expectedJoiningDate} onChange={e => setFormData({ ...formData, expectedJoiningDate: e.target.value })} />
            </div>
            
            <div>
              <label className="form-label">Preferred Room Type <span className="text-red-500">*</span></label>
              <select className="input-field" required
                value={formData.preferredRoomType} onChange={e => setFormData({ ...formData, preferredRoomType: e.target.value })}>
                <option value="">Select Room Type...</option>
                <option value="1 Seater">1 Seater</option>
                <option value="2 Seater">2 Seater</option>
                <option value="3 Seater">3 Seater</option>
                <option value="4 Seater">4 Seater</option>
                <option value="Dormitory">Dormitory</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-surface-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
            <h2 className="text-lg font-bold text-text-primary">Personal Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name <span className="text-red-500">*</span></label>
              <input type="text" className="input-field" required placeholder="John Doe"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" className="input-field" required placeholder="10-digit number"
                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Email Address <span className="text-red-500">*</span></label>
              <input type="email" className="input-field" required placeholder="john@example.com"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            
            <div>
              <label className="form-label">College / Workplace</label>
              <input type="text" className="input-field" placeholder="Optional"
                value={formData.college} onChange={e => setFormData({ ...formData, college: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Guardian Name</label>
              <input type="text" className="input-field" placeholder="Optional"
                value={formData.guardianName} onChange={e => setFormData({ ...formData, guardianName: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Guardian Phone</label>
              <input type="tel" className="input-field" placeholder="Optional"
                value={formData.guardianPhone} onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-surface-border">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">3</div>
            <h2 className="text-lg font-bold text-text-primary">Token Payment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Token Amount Paid (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="0" className="input-field" required placeholder="e.g. 2000"
                value={formData.tokenAmount} onChange={e => setFormData({ ...formData, tokenAmount: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Payment Method <span className="text-red-500">*</span></label>
              <select className="input-field" required
                value={formData.tokenPaymentMethod} onChange={e => setFormData({ ...formData, tokenPaymentMethod: e.target.value })}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>This token amount will be recorded against this booking. When the tenant arrives and you convert this booking into a permanent tenant, this token amount will be automatically deducted from their initial payment dues.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={createPreBooking.isPending} className="btn-primary min-w-[160px]">
            {createPreBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Save Booking</>}
          </button>
        </div>
      </form>
    </div>
  );
}
