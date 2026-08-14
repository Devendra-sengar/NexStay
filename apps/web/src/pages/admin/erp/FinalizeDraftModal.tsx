import { useState } from 'react';
import { useFinalizeDraft, useErpRooms, useRoomBeds } from '@/lib/adminApi';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FinalizeDraftModalProps {
  student: any;
  onClose: () => void;
}

export function FinalizeDraftModal({ student, onClose }: FinalizeDraftModalProps) {
  const { mutateAsync: finalizeDraft, isPending } = useFinalizeDraft();

  const [formData, setFormData] = useState({
    roomId: '',
    bedId: '',
    admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    stayingPeriod: student.stayingPeriod || '12',
    monthlyRent: student.monthlyRent?.toString() || '0',
    securityDeposit: student.securityDeposit?.toString() || '0',
    fatherName: student.fatherName || '',
    motherName: student.motherName || '',
    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().slice(0, 10) : '',
    bloodGroup: student.bloodGroup || '',
    maritalStatus: student.maritalStatus || 'SINGLE',
    education: student.education || '',
    occupation: student.occupation || '',
    organization: student.organization || '',
    permanentAddress: student.permanentAddress || '',
    vehicleNumber: student.vehicleNumber || '',
    medicalHistory: student.medicalHistory || '',
    aadhaarNumber: student.aadhaarNumber || '',
    guardianName: student.guardianName || '',
    guardianPhone: student.guardianPhone || '',
    guardianAddress: student.guardianAddress || '',
    fatherOccupation: student.fatherOccupation || '',
    college: student.college || '',
    initialPaidAmount: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const { data: floorsData } = useErpRooms(student.propertyId);
  const rooms = (floorsData || []).flatMap((f: any) => f.rooms || []);
  const { data: bedsData } = useRoomBeds(formData.roomId);
  const beds = bedsData || [];
  const availableBeds = beds.filter((b: any) => b.status === 'AVAILABLE');

  const handleBedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selectedBed = availableBeds.find((b: any) => b._id === val);
    const selectedRoom = rooms.find((r: any) => r._id === formData.roomId);
    
    // Fallback: Bed price -> Room base price -> 0
    const bedRent = selectedBed?.price || selectedRoom?.pricePerBed || 0;
    
    setFormData(p => ({
      ...p,
      bedId: val,
      monthlyRent: bedRent > 0 ? bedRent.toString() : p.monthlyRent
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.admissionDate) {
      toast.error('Move-in date is required');
      return;
    }
    if (!formData.roomId || !formData.bedId) {
      toast.error('Room and Bed selection is required');
      return;
    }
    try {
      await finalizeDraft({ id: student._id, data: formData });
      toast.success('Draft finalized successfully! Rent record created.');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to finalize draft');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-50 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Finalize Tenant Draft</h2>
            <p className="text-sm text-text-muted mt-1">Complete the details for {student.name} to activate their account.</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-black/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="finalizeForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-full border-b border-surface-border pb-4 mb-2">
                <h3 className="font-medium text-text-primary mb-4">Room & Bed Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Room <span className="text-danger">*</span></label>
                    <select
                      name="roomId"
                      value={formData.roomId}
                      onChange={e => {
                        setFormData(p => ({ ...p, roomId: e.target.value, bedId: '' }));
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map((r: any) => <option key={r._id} value={r._id}>{r.roomNumber}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Bed <span className="text-danger">*</span></label>
                    <select
                      name="bedId"
                      value={formData.bedId}
                      onChange={handleBedChange}
                      className="input-field"
                      required
                      disabled={!formData.roomId}
                    >
                      <option value="">Select Bed</option>
                      {availableBeds.map((b: any) => <option key={b._id} value={b._id}>{b.bedNumber}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Move-in Date <span className="text-danger">*</span></label>
                <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="input-field" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Lock-in Period (Months)</label>
                <input type="number" name="stayingPeriod" value={formData.stayingPeriod} onChange={handleChange} className="input-field" placeholder="e.g. 12" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Monthly Rent (₹)</label>
                <input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} className="input-field" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Security Deposit (₹)</label>
                <input type="number" name="securityDeposit" value={formData.securityDeposit} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Initial Paid Amount (₹)</label>
                <input type="number" name="initialPaidAmount" value={formData.initialPaidAmount} onChange={handleChange} className="input-field" placeholder="Amount paid now..." />
              </div>

              <div className="col-span-full border-t border-surface-border my-2 pt-4">
                <h3 className="font-medium text-text-primary mb-4">Personal Details</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input-field">
                  <option value="">Select...</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Aadhaar Number</label>
                <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} className="input-field" placeholder="12-digit Aadhaar" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Father's Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Father's Occupation</label>
                <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Mother's Name</label>
                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className="input-field" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Education / Course</label>
                <input type="text" name="education" value={formData.education} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Occupation</label>
                <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Company / Organization</label>
                <input type="text" name="organization" value={formData.organization} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">College Name</label>
                <input type="text" name="college" value={formData.college} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Vehicle Number</label>
                <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="input-field" placeholder="e.g. MH 12 AB 1234" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Medical History / Allergies</label>
                <input type="text" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} className="input-field" placeholder="Any medical conditions..." />
              </div>

              <div className="col-span-full border-t border-surface-border my-2 pt-4">
                <h3 className="font-medium text-text-primary mb-4">Guardian / Emergency Contact</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Guardian Name</label>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Guardian Phone</label>
                <input type="text" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className="input-field" placeholder="10-digit number" />
              </div>
              <div className="col-span-full space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Guardian Address</label>
                <input type="text" name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} className="input-field" placeholder="Full guardian address..." />
              </div>
            </div>

            <div className="space-y-1.5 mt-5">
              <label className="text-sm font-medium text-text-secondary">Permanent Address</label>
              <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="input-field min-h-24" placeholder="Full permanent address..." />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-surface-border bg-surface-50 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary px-5" disabled={isPending}>
            Cancel
          </button>
          <button type="submit" form="finalizeForm" className="btn-primary px-6 flex items-center gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Finalize Tenant
          </button>
        </div>
      </div>
    </div>
  );
}
