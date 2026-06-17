import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import { useProperty, useCreateProperty, useUpdateProperty } from '@/hooks/useProperties';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Enter a full address'),
  city: z.string().min(2, 'City is required'),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});
type FormData = z.infer<typeof schema>;

const AMENITY_OPTIONS = ['WiFi', 'Meals', 'Laundry', 'Parking', 'CCTV', 'Gym', 'RO Water', 'Power Backup', 'Housekeeping', 'AC'];

const CITIES = ['Pune', 'Bangalore', 'Mumbai', 'Delhi', 'Indore', 'Jabalpur', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Jaipur'];

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: property, isLoading: propertyLoading } = useProperty(id || '');
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty(id || '');

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amenities: [], images: [] },
  });

  const selectedAmenities = watch('amenities') || [];
  const images = watch('images') || [];

  useEffect(() => {
    if (isEdit && property) {
      reset({
        name: property.name,
        address: property.address,
        city: property.city,
        description: property.description,
        amenities: property.amenities || [],
        images: property.images || [],
      });
    }
  }, [property, isEdit, reset]);

  const toggleAmenity = (a: string) => {
    const current = selectedAmenities;
    setValue('amenities', current.includes(a) ? current.filter(x => x !== a) : [...current, a]);
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) setValue('images', [...images, url]);
  };

  const removeImage = (idx: number) => {
    setValue('images', images.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate('/erp/properties');
    } catch (err: any) {
      console.error(err);
    }
  };

  if (isEdit && propertyLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  const mutationError = (createMutation.error || updateMutation.error) as any;

  return (
    <div className="page-container max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate('/erp/properties')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </button>

      <h1 className="section-header mb-1">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
      <p className="text-text-muted text-sm mb-6">{isEdit ? `Editing: ${property?.name}` : 'Fill in the details to create a new PG property'}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wide mb-4">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Property Name *</label>
            <input {...register('name')} placeholder="e.g. Sunrise Boys PG" className={cn('input-field', errors.name && 'border-status-error')} />
            {errors.name && <p className="text-status-error text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">City *</label>
              <select {...register('city')} className={cn('input-field', errors.city && 'border-status-error')}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
              {errors.city && <p className="text-status-error text-xs mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Full Address *</label>
              <input {...register('address')} placeholder="Plot no., street, area" className={cn('input-field', errors.address && 'border-status-error')} />
              {errors.address && <p className="text-status-error text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Describe the PG, surroundings, facilities..."
              className="input-field resize-none" />
          </div>
        </div>

        {/* Amenities */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wide mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(a => (
              <button
                key={a} type="button" onClick={() => toggleAmenity(a)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200',
                  selectedAmenities.includes(a)
                    ? 'bg-brand-primary border-brand-primary text-white'
                    : 'bg-surface-dark border-surface-border text-text-muted hover:border-brand-primary hover:text-brand-primary'
                )}
              >
                {a}
              </button>
            ))}
          </div>
          {selectedAmenities.length > 0 && (
            <p className="text-text-faint text-xs mt-3">{selectedAmenities.length} amenities selected</p>
          )}
        </div>

        {/* Images */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wide">Images</h2>
            <button type="button" onClick={addImage} className="btn-ghost text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Image URL
            </button>
          </div>
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-surface-dark border border-surface-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} />
                  <button type="button" onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-status-error text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">Cover</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-surface-border rounded-lg p-8 text-center">
              <p className="text-text-faint text-sm">No images added yet</p>
              <p className="text-text-faint text-xs mt-1">Click "Add Image URL" to add property images</p>
            </div>
          )}
        </div>

        {/* Error */}
        {mutationError && (
          <div className="bg-status-error/10 border border-status-error/30 rounded-md px-4 py-3 text-sm text-status-error">
            {mutationError?.response?.data?.message || 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/erp/properties')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
