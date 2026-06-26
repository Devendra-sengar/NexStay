import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadedImage {
  url: string;
  public_id: string;
  name: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface CloudinaryUploadProps {
  /** Current image URLs (existing) */
  value: string[];
  /** Called whenever the image list changes */
  onChange: (urls: string[]) => void;
  /** Max number of images allowed */
  maxImages?: number;
  /** CSS class override */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CloudinaryUpload({
  value = [],
  onChange,
  maxImages = 10,
  className,
}: CloudinaryUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  // ─── Upload a single File to backend → Cloudinary
  const uploadFile = useCallback(
    async (file: File) => {
      const id = `${Date.now()}-${Math.random()}`;
      const entry: UploadingFile = { id, name: file.name, progress: 0, status: 'uploading' };
      setUploading(prev => [...prev, entry]);

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 90) : 50;
            setUploading(prev =>
              prev.map(u => (u.id === id ? { ...u, progress: pct } : u))
            );
          },
        });

        const { url } = res.data;

        // Mark done
        setUploading(prev =>
          prev.map(u => (u.id === id ? { ...u, progress: 100, status: 'done' } : u))
        );

        // Add URL to parent
        onChange([...value, url]);

        // Remove from uploading list after 1.5s
        setTimeout(() => setUploading(prev => prev.filter(u => u.id !== id)), 1500);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Upload failed';
        setUploading(prev =>
          prev.map(u => (u.id === id ? { ...u, status: 'error', error: msg } : u))
        );
        setTimeout(() => setUploading(prev => prev.filter(u => u.id !== id)), 3000);
      }
    },
    [value, onChange]
  );

  // ─── Process selected files
  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - value.length;
      if (remaining <= 0) return;

      const toUpload = Array.from(files)
        .slice(0, remaining)
        .filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);

      toUpload.forEach(uploadFile);
    },
    [value.length, maxImages, uploadFile]
  );

  // ─── Drag events
  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // ─── File input change
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Remove an uploaded image
  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const canUploadMore = value.length + uploading.filter(u => u.status === 'uploading').length < maxImages;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      {canUploadMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-brand-primary bg-brand-primary/10 scale-[1.01]'
              : 'border-surface-border hover:border-brand-primary/60 hover:bg-brand-primary/5'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
                isDragging ? 'bg-brand-primary text-white' : 'bg-surface-dark text-brand-primary'
              )}
            >
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-text-primary font-medium text-sm">
                {isDragging ? 'Drop images here!' : 'Drag & drop images here'}
              </p>
              <p className="text-text-faint text-xs mt-1">
                or{' '}
                <span className="text-brand-primary underline underline-offset-2">
                  click to browse
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-text-faint text-xs mt-1">
              <span>JPEG, PNG, WebP</span>
              <span>•</span>
              <span>Max 5MB each</span>
              <span>•</span>
              <span>{value.length}/{maxImages} uploaded</span>
            </div>
          </div>
        </div>
      )}

      {/* Uploading in-progress list */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(u => (
            <div
              key={u.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm',
                u.status === 'error'
                  ? 'bg-status-error/10 border-status-error/30'
                  : 'bg-surface-dark border-surface-border'
              )}
            >
              {u.status === 'uploading' && (
                <Loader2 className="w-4 h-4 text-brand-primary animate-spin flex-shrink-0" />
              )}
              {u.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
              )}
              {u.status === 'error' && (
                <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary truncate">{u.name}</p>
                {u.status === 'uploading' && (
                  <div className="mt-1.5 h-1 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
                {u.status === 'error' && (
                  <p className="text-status-error text-xs mt-0.5">{u.error}</p>
                )}
                {u.status === 'done' && (
                  <p className="text-status-success text-xs mt-0.5">Uploaded successfully!</p>
                )}
              </div>
              {u.status !== 'uploading' && (
                <span className="text-text-faint text-xs">
                  {u.status === 'done' ? u.progress + '%' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {value.map((url, idx) => (
            <div
              key={idx}
              className="relative group aspect-video rounded-lg overflow-hidden bg-surface-dark border border-surface-border"
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-8 h-8 rounded-full bg-status-error text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cover badge */}
              {idx === 0 && (
                <div className="absolute bottom-1.5 left-1.5">
                  <span className="text-[10px] bg-brand-primary text-white px-2 py-0.5 rounded-full font-medium">
                    Cover
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {value.length === 0 && uploading.length === 0 && (
        <div className="flex items-center gap-2 text-text-faint text-xs">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>First image will be used as the cover photo</span>
        </div>
      )}

      {/* Max reached warning */}
      {!canUploadMore && (
        <p className="text-text-faint text-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
          Maximum {maxImages} images uploaded. Remove one to add more.
        </p>
      )}
    </div>
  );
}
