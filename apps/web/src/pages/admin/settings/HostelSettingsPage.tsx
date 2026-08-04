import { useState, useEffect } from 'react';
import { Building2, Save, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyHostels, useUpdateMyHostelSettings } from '@/lib/adminApi';
import CloudinaryUpload from '@/components/ui/CloudinaryUpload';

export default function HostelSettingsPage() {
  const { data: hostels, isLoading } = useMyHostels();
  const updateSettings = useUpdateMyHostelSettings();
  
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    if (hostels && hostels.length > 0 && !selectedHostelId) {
      setSelectedHostelId(hostels[0]._id);
    }
  }, [hostels, selectedHostelId]);

  useEffect(() => {
    if (selectedHostelId && hostels) {
      const h = hostels.find(h => h._id === selectedHostelId);
      setLogoUrl(h?.printLogoUrl || '');
    }
  }, [selectedHostelId, hostels]);

  const handleSave = async () => {
    if (!selectedHostelId) return;
    try {
      await updateSettings.mutateAsync({
        id: selectedHostelId,
        data: { printLogoUrl: logoUrl }
      });
      toast.success('Hostel settings updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <div className="skeleton h-12 w-1/3 rounded-lg" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!hostels || hostels.length === 0) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text-primary">No Hostels Found</h2>
          <p className="text-sm text-text-muted mt-1">You do not own any hostels yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hostel Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage print templates and custom branding</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={updateSettings.isPending}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> 
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Select Hostel</label>
          <select 
            className="input-field max-w-md"
            value={selectedHostelId}
            onChange={(e) => setSelectedHostelId(e.target.value)}
          >
            {hostels.map(h => (
              <option key={h._id} value={h._id}>{h.name} ({h.hostelCode})</option>
            ))}
          </select>
        </div>

        <div className="border-t border-surface-border pt-6">
          <h3 className="text-lg font-bold text-text-primary mb-1">Registration Form Logo</h3>
          <p className="text-sm text-text-muted mb-4">
            Upload a custom logo to display on the tenant registration print templates. 
            For best results, use a transparent PNG image.
          </p>

          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-40">
              <CloudinaryUpload 
                value={logoUrl ? [logoUrl] : []}
                onChange={(urls) => setLogoUrl(urls[0] || '')}
                maxImages={1}
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Logo Preview</label>
              <div className="w-48 h-48 border-2 border-dashed border-surface-border rounded-xl flex items-center justify-center bg-surface-input overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Hostel Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-text-muted">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">No logo uploaded</span>
                  </div>
                )}
              </div>
              {logoUrl && (
                <button 
                  onClick={() => setLogoUrl('')}
                  className="text-xs text-red-500 hover:text-red-600 font-medium mt-3"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
