import { useState } from 'react';
import { X, Upload, FileUp, Loader2, AlertCircle, Save } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { useAdminProperties, useErpRooms, useRoomBeds, useBulkUploadStudents } from '@/lib/adminApi';
import { useLocation } from 'react-router-dom';

export function BulkUploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [globalPropertyId, setGlobalPropertyId] = useState('');
  
  const { pathname } = useLocation();
  const isWarden = pathname.startsWith('/warden');
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];

  const effectivePropertyId = isWarden && properties.length > 0 ? properties[0]._id : globalPropertyId;
  const { mutate: uploadStudents, isPending } = useBulkUploadStudents();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setIsParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mappedData = results.data.map((rawRow: any) => {
          // Normalize row keys to lowercase and trim spaces for robust matching
          const row: any = {};
          for (const key in rawRow) {
            row[key.trim().toLowerCase()] = rawRow[key];
          }

          return {
            name: row['tenant name'] || row['name'] || '',
            phone: row['contact no'] || row['phone'] || row['mobile'] || '',
            dateOfBirth: row['date of birth'] || row['dob'] || '',
            admissionDate: row['date of joining'] || row['doj'] || row['admission date'] || '',
            aadhaarNumber: row['aadhar no'] || row['aadhaar'] || row['aadhar number'] || '',
            occupation: row['occupation'] || '',
            fatherName: row['father name'] || row["father's name"] || '',
            motherName: row['mother name'] || row["mother's name"] || '',
            fatherContact: row['father contact no'] || row['father contact'] || '',
            permanentAddress: row['permanent address'] || row['address'] || '',
            organization: row['organization name'] || row['company'] || row['college'] || '',
            bloodGroup: row['blood group'] || '',
            maritalStatus: row['maritial status'] || row['marital status'] || '',
            email: row['email address'] || row['email'] || '',
            roomId: '',
            bedId: '',
          };
        });
        setParsedData(mappedData);
        setIsParsing(false);
      },
      error: (err) => {
        toast.error('Failed to parse CSV file');
        console.error(err);
        setIsParsing(false);
      }
    });
  };



  const handleSubmit = () => {
    if (!isWarden && !globalPropertyId) {
      toast.error('Please select a Property for these tenants');
      return;
    }

    const missingAssignments = parsedData.some(row => !row.name || !row.phone || !row.email);
    if (missingAssignments) {
      toast.error('Please ensure all rows have Name, Phone, and Email assigned.');
      return;
    }

    const payload = parsedData.map(row => ({
      ...row,
      propertyId: effectivePropertyId,
    }));

    uploadStudents(payload, {
      onSuccess: (res: any) => {
        const successes = res.data.filter((r: any) => r.success).length;
        const fails = res.data.filter((r: any) => !r.success).length;
        if (fails > 0) {
          toast.error(`Successfully uploaded ${successes} tenants, but ${fails} failed.`);
          setUploadErrors(res.data.filter((r: any) => !r.success));
        } else {
          toast.success(`Successfully uploaded ${successes} tenants!`);
          onClose();
        }
      },
      onError: (err: any) => {
        console.error("Upload error details:", err);
        toast.error(err?.response?.data?.message || err.message || 'Bulk upload failed');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" /> Bulk Upload Tenants
            </h2>
            <p className="text-sm text-text-muted mt-1">Upload a CSV file to add multiple tenants at once.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-border text-text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-surface-50/50">
          <div className="max-w-2xl mx-auto space-y-6 mb-8">
            {!isWarden && properties.length > 0 && (
              <div className="space-y-2">
                <label className="form-label font-medium text-text-primary">Target Property</label>
                <select 
                  className="input-field w-full bg-white"
                  value={globalPropertyId}
                  onChange={e => setGlobalPropertyId(e.target.value)}
                >
                  <option value="">Select a property to assign tenants to...</option>
                  {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="form-label font-medium text-text-primary">CSV File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-surface-border rounded-xl p-8 text-center bg-white hover:border-primary/50 hover:bg-primary/5 transition-all">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                  ) : (
                    <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
                  )}
                  <p className="font-medium text-text-primary">{file ? file.name : 'Click or drag CSV file here'}</p>
                  <p className="text-sm text-text-muted mt-1">Must contain headers like Tenant Name, contact no, Date of joining, etc.</p>
                  <p className="text-xs text-text-muted mt-1">(Dates should be in <strong>DD/MM/YYYY</strong> or <strong>MM/DD/YYYY</strong> format)</p>
                </div>
              </div>
            </div>
          </div>

          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary">Preview Data ({parsedData.length} rows)</h3>
                {(!effectivePropertyId) && (
                  <p className="text-sm text-danger flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Select a Property above to assign rooms and beds.
                  </p>
                )}
              </div>
              <div className="card overflow-hidden border border-surface-border">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-surface-100 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-text-secondary border-b">Tenant Name</th>
                        <th className="py-3 px-4 font-semibold text-text-secondary border-b">Phone</th>
                        <th className="py-3 px-4 font-semibold text-text-secondary border-b">Email</th>
                        {uploadErrors.length > 0 && <th className="py-3 px-4 font-semibold text-danger border-b">Error</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border bg-white">
                      {parsedData.map((row, i) => {
                        const error = uploadErrors.find(e => e.phone === row.phone);
                        return (
                          <tr key={i} className={`transition-colors ${error ? 'bg-danger/5' : 'hover:bg-surface-50'}`}>
                            <td className="py-2 px-4 whitespace-nowrap">{row.name || <span className="text-danger">Missing</span>}</td>
                            <td className="py-2 px-4 whitespace-nowrap">{row.phone || <span className="text-danger">Missing</span>}</td>
                            <td className="py-2 px-4 whitespace-nowrap">{row.email || <span className="text-danger">Missing</span>}</td>
                            {uploadErrors.length > 0 && (
                              <td className="py-2 px-4 text-danger text-xs font-medium max-w-xs truncate" title={error?.error}>
                                {error?.error || ''}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="px-6 py-4 border-t border-surface-border bg-surface-50 shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary" disabled={isPending}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            className="btn-primary flex items-center gap-2"
            disabled={parsedData.length === 0 || isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Tenants
          </button>
        </div>

      </div>
    </div>
  );
}
