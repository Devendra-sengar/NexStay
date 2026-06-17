import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Tenants ──────────────────────────────────────────────────────────────────
export const useTenants = (params?: { search?: string; propertyId?: string; status?: string; page?: number }) =>
  useQuery({
    queryKey: ['tenants', params],
    queryFn: () => api.get('/tenants', { params }).then(r => r.data),
  });

export const useTenant = (id: string) =>
  useQuery({
    queryKey: ['tenants', id],
    queryFn: () => api.get(`/tenants/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

export const usePendingBookings = (propertyId?: string) =>
  useQuery({
    queryKey: ['tenants', 'pending-bookings', propertyId],
    queryFn: () => api.get('/tenants/pending-bookings', { params: propertyId ? { propertyId } : {} }).then(r => r.data.data),
  });

// ─── Booking workflow ─────────────────────────────────────────────────────────
export const useBooking = (id: string) =>
  useQuery({
    queryKey: ['bookings', id],
    queryFn: () => api.get(`/bookings/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

export const useBookingDues = (id: string) =>
  useQuery({
    queryKey: ['bookings', id, 'dues'],
    queryFn: () => api.get(`/bookings/${id}/dues`).then(r => r.data.data),
    enabled: !!id,
  });

export const useAvailableBeds = (propertyId: string, roomType?: string) =>
  useQuery({
    queryKey: ['bookings', 'available-beds', propertyId, roomType],
    queryFn: () => api.get(`/bookings/available-beds/${propertyId}`, { params: roomType ? { roomType } : {} }).then(r => r.data.data),
    enabled: !!propertyId,
  });

export const useProcessCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) =>
      api.post(`/bookings/${bookingId}/checkin`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['beds'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useProcessCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) =>
      api.post(`/bookings/${bookingId}/checkout`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['beds'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/bookings', data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['beds'] });
    },
  });
};
