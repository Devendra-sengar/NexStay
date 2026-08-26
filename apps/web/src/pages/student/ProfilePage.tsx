import { useState } from 'react';
import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Mail, Key, Users, FileText, Upload, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function DocUpload({ label, value, verified, onChange }: { label: string; value?: string; verified?: boolean; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only images and PDF accepted'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, background: value ? '#eff6ff' : '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={20} color={value ? '#1d4ed8' : '#94a3b8'} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{label}</p>
          {value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none' }}>View Document ↗</a>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Not uploaded</p>
          )}
        </div>
      </div>
      <div>
        {verified ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
            <CheckCircle2 size={16} /> Verified
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer', color: '#0f172a' }}
            >
              {uploading ? 'Uploading...' : value ? 'Change' : 'Upload'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: () => api.get('/student/profile').then(r => r.data.data) });
  const { data: roommates } = useQuery({ queryKey: ['student-roommates'], queryFn: () => api.get('/student/roommates').then(r => r.data.data) });

  const qc = useQueryClient();
  const updateDoc = useMutation({
    mutationFn: (data: { aadhaarUrl?: string; studentIdUrl?: string; photoUrl?: string }) => api.patch('/student/profile', data),
    onSuccess: () => {
      toast.success('Document updated successfully');
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update document')
  });

  const pwMutation = useMutation({
    mutationFn: () => {
      if (pw.newPassword !== pw.confirm) throw new Error('Passwords do not match');
      return api.patch('/student/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
    },
    onSuccess: () => { toast.success('Password changed!'); setShowPwForm(false); setPw({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || 'Failed'),
  });

  const sr = data?.studentRecord;
  const rm: any[] = roommates || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>My Profile</h1>

      {/* User Info */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="#1d4ed8" />
          </div>
          <div>
            <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>{user?.name}</p>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Tenant ID: {user?.studentId || user?.phone}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { icon: Phone, label: 'Mobile', value: user?.phone },
            { icon: Mail, label: 'Email', value: user?.email || 'Not set' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
              <item.icon size={16} color="#64748b" />
              <div>
                <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{item.label}</p>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 500, margin: '2px 0 0' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      {sr && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} /> My Documents</h3>
          <DocUpload 
            label="Aadhaar Card" 
            value={sr.aadhaarUrl} 
            verified={sr.isAadhaarVerified} 
            onChange={(url) => updateDoc.mutate({ aadhaarUrl: url })} 
          />
          <DocUpload 
            label="Tenant ID Card" 
            value={sr.studentIdUrl} 
            verified={sr.isStudentIdVerified} 
            onChange={(url) => updateDoc.mutate({ studentIdUrl: url })} 
          />
          <DocUpload 
            label="Passport Photo" 
            value={sr.photoUrl} 
            verified={sr.isPhotoVerified} 
            onChange={(url) => updateDoc.mutate({ photoUrl: url })} 
          />
        </div>
      )}

      {/* Stay info */}
      {sr && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Hostel Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Admission Date', value: sr.admissionDate ? new Date(sr.admissionDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Monthly Rent', value: `₹${sr.monthlyRent?.toLocaleString('en-IN')}` },
              { label: 'Security Deposit', value: `₹${sr.securityDeposit?.toLocaleString('en-IN')}` },
              { label: 'Status', value: sr.status },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roommates */}
      {rm.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} /> Roommates</h3>
          {rm.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < rm.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 32, height: 32, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#64748b" />
              </div>
              <div>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{r.name}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Bed {r.bedNumber}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Password */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPwForm ? 12 : 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Key size={16} /> Change Password</h3>
          <button onClick={() => setShowPwForm(p => !p)} style={{ background: '#eff6ff', border: 'none', color: '#1d4ed8', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            {showPwForm ? 'Cancel' : 'Change'}
          </button>
        </div>
        {showPwForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['currentPassword', 'newPassword', 'confirm'].map(f => (
              <input key={f} type="password" placeholder={f === 'currentPassword' ? 'Current password' : f === 'newPassword' ? 'New password (min 4 chars)' : 'Confirm new password'}
                value={(pw as any)[f]} onChange={e => setPw(p => ({ ...p, [f]: e.target.value }))}
                style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            ))}
            <button onClick={() => pwMutation.mutate()} disabled={pwMutation.isPending} style={{ padding: '10px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
              {pwMutation.isPending ? 'Saving…' : 'Save Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
