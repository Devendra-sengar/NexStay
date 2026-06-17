import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then(r => r.data.data),
  });

export const useAdminStudents = (search?: string) =>
  useQuery({
    queryKey: ['admin', 'students', search],
    queryFn: () => api.get('/admin/users/students', { params: { q: search } }).then(r => r.data.data),
  });

export const useAdminOwners = (search?: string) =>
  useQuery({
    queryKey: ['admin', 'owners', search],
    queryFn: () => api.get('/admin/users/owners', { params: { q: search } }).then(r => r.data.data),
  });

export const useAdminManagers = (search?: string) =>
  useQuery({
    queryKey: ['admin', 'managers', search],
    queryFn: () => api.get('/admin/users/managers', { params: { q: search } }).then(r => r.data.data),
  });

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      api.put(`/admin/users/${id}/status`, { status }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'students'] });
      qc.invalidateQueries({ queryKey: ['admin', 'owners'] });
      qc.invalidateQueries({ queryKey: ['admin', 'managers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useVerifyOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      api.put(`/admin/users/${id}/verify`, { status, reason }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'owners'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const usePendingProperties = () =>
  useQuery({
    queryKey: ['admin', 'properties', 'pending'],
    queryFn: () => api.get('/admin/properties/pending').then(r => r.data.data),
  });

export const useVerifyProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      api.put(`/admin/properties/${id}/verify`, { status, reason }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'properties', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminBookings = (filters?: { q?: string; status?: string }) =>
  useQuery({
    queryKey: ['admin', 'bookings', filters],
    queryFn: () => api.get('/admin/bookings', { params: filters }).then(r => r.data.data),
  });

export const useAdminPayments = (filters?: { q?: string; status?: string }) =>
  useQuery({
    queryKey: ['admin', 'payments', filters],
    queryFn: () => api.get('/admin/payments', { params: filters }).then(r => r.data.data),
  });
