import { useState, useEffect } from 'react';
import { X, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface ReceiptModalProps {
  url: string;
  onClose: () => void;
  fileName: string;
}

export default function ReceiptModal({ url, onClose, fileName }: ReceiptModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await api.get(url, { responseType: 'text' });
        setHtml(res.data);
      } catch (err) {
        toast.error('Failed to load receipt');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [url, onClose]);

  const handleDownload = async () => {
    if (!html) return;
    setDownloading(true);
    const toastId = toast.loading('Generating PDF...');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };
      
      await html2pdf().set(opt).from(html).save();
      
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Printer className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Receipt Preview</h3>
              <p className="text-xs text-text-muted">{fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-input flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-100 p-4 relative overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            html && (
              <iframe
                srcDoc={html}
                title="Receipt Preview"
                className="w-full h-full border-none bg-white rounded-lg shadow-sm"
                sandbox="allow-same-origin allow-scripts"
              />
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border flex justify-end gap-3 bg-white rounded-b-2xl">
          <button className="btn-secondary px-6" onClick={onClose}>
            Close
          </button>
          <button 
            className="btn-primary flex items-center gap-2 px-6 bg-emerald-600 hover:bg-emerald-700" 
            onClick={handleDownload}
            disabled={downloading || loading}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
