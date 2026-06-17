import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Owner/Manager ────────────────────────────────────────────────────────────
export const useComplaints = (params?: { status?: string; category?: string; propertyId?: string; page?: number }) =>
  useQuery({
    queryKey: ['complaints', params],
    queryFn: () => api.get('/complaints', { params }).then(r => r.data),
  });

export const useComplaint = (id: string) =>
  useQuery({
    queryKey: ['complaints', id],
    queryFn: () => api.get(`/complaints/${id}`).then(r => r.data.data),
    enabled: !!id,
    refetchInterval: 15000, // poll every 15s for real-time-ish updates
  });

export const usePropertyManagers = () =>
  useQuery({
    queryKey: ['complaints', 'managers'],
    queryFn: () => api.get('/complaints/meta/managers').then(r => r.data.data),
  });

export const useUpdateComplaintStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.put(`/complaints/${id}/status`, { status, note }).then(r => r.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['complaints', vars.id] });
    },
  });
};

export const useAssignComplaint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string | null }) =>
      api.put(`/complaints/${id}/assign`, { assignedTo }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });
};

// ─── Student ──────────────────────────────────────────────────────────────────
export const useMyComplaints = () =>
  useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => api.get('/complaints/my').then(r => r.data.data),
    refetchInterval: 20000,
  });

export const useRaiseComplaint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; category: string }) =>
      api.post('/complaints', data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-complaints'] }),
  });
};
