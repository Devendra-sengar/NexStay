import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Properties ───────────────────────────────────────────────────────────────
export const useProperties = (params?: { search?: string; verificationStatus?: string }) =>
  useQuery({
    queryKey: ['properties', params],
    queryFn: () => api.get('/properties', { params }).then(r => r.data),
  });

export const useProperty = (id: string) =>
  useQuery({
    queryKey: ['properties', id],
    queryFn: () => api.get(`/properties/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/properties', data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
};

export const useUpdateProperty = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put(`/properties/${id}`, data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties', id] });
    },
  });
};

export const useDeleteProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
};

// ─── Floors ───────────────────────────────────────────────────────────────────
export const useFloors = (propertyId: string) =>
  useQuery({
    queryKey: ['floors', propertyId],
    queryFn: () => api.get(`/properties/${propertyId}/floors`).then(r => r.data.data),
    enabled: !!propertyId,
  });

export const useCreateFloor = (propertyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post(`/properties/${propertyId}/floors`, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floors', propertyId] }),
  });
};

export const useUpdateFloor = (propertyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put(`/properties/${propertyId}/floors/${id}`, { name }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floors', propertyId] }),
  });
};

export const useDeleteFloor = (propertyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${propertyId}/floors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floors', propertyId] }),
  });
};

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const useRooms = (propertyId: string, floorId: string) =>
  useQuery({
    queryKey: ['rooms', propertyId, floorId],
    queryFn: () => api.get(`/properties/${propertyId}/floors/${floorId}/rooms`).then(r => r.data.data),
    enabled: !!propertyId && !!floorId,
  });

export const usePropertyRooms = (propertyId: string) =>
  useQuery({
    queryKey: ['rooms', 'property', propertyId],
    queryFn: () => api.get(`/properties/${propertyId}/rooms`).then(r => r.data.data),
    enabled: !!propertyId,
  });

export const useCreateRoom = (propertyId: string, floorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post(`/properties/${propertyId}/floors/${floorId}/rooms`, { ...data, propertyId }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', propertyId, floorId] });
      qc.invalidateQueries({ queryKey: ['rooms', 'property', propertyId] });
    },
  });
};

export const useUpdateRoom = (propertyId: string, floorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api.put(`/properties/${propertyId}/floors/${floorId}/rooms/${id}`, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

export const useDeleteRoom = (propertyId: string, floorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${propertyId}/floors/${floorId}/rooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

// ─── Beds ─────────────────────────────────────────────────────────────────────
export const useBeds = (propertyId: string, floorId: string, roomId: string) =>
  useQuery({
    queryKey: ['beds', roomId],
    queryFn: () =>
      api.get(`/properties/${propertyId}/floors/${floorId}/rooms/${roomId}/beds`).then(r => r.data.data),
    enabled: !!roomId,
  });

export const useCreateBed = (propertyId: string, floorId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post(`/properties/${propertyId}/floors/${floorId}/rooms/${roomId}/beds`, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds', roomId] }),
  });
};

export const useUpdateBed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/beds/${id}`, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds'] }),
  });
};

export const useDeleteBed = (roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/beds/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds', roomId] }),
  });
};
