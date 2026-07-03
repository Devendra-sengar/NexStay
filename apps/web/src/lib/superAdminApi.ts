import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

const getToken = () => localStorage.getItem('nexstay_token');
const sa = (url: string, options?: any) =>
  apiClient({ url: `/superadmin${url}`, ...options });

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useSuperDashboard() {
  return useQuery({ queryKey: ['super-dashboard'], queryFn: async () => { const { data } = await sa('/dashboard'); return data.data as any; }, staleTime: 60000 });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function useSuperGuests(params?: Record<string, string>) {
  return useQuery({ queryKey: ['super-guests', params], queryFn: async () => { const { data } = await sa('/users/guests', { params }); return data as any; }, staleTime: 30000 });
}
export function useSuperOwners(params?: Record<string, string>) {
  return useQuery({ queryKey: ['super-owners', params], queryFn: async () => { const { data } = await sa('/users/owners', { params }); return data as any; }, staleTime: 30000 });
}
export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await sa(`/users/${id}/suspend`, { method: 'PATCH' }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-guests'] }); qc.invalidateQueries({ queryKey: ['super-owners'] }); },
  });
}
export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await sa(`/users/${id}/reactivate`, { method: 'PATCH' }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-guests'] }); qc.invalidateQueries({ queryKey: ['super-owners'] }); },
  });
}

// ── Properties ────────────────────────────────────────────────────────────────
export function useSuperProperties(params?: Record<string, string>) {
  return useQuery({ queryKey: ['super-properties', params], queryFn: async () => { const { data } = await sa('/properties', { params }); return data as any; }, staleTime: 30000 });
}
export function useSuperPropertyDetail(id: string | null) {
  return useQuery({ queryKey: ['super-property', id], queryFn: async () => { const { data } = await sa(`/properties/${id}`); return data.data as any; }, enabled: !!id, staleTime: 10000 });
}
export function useApproveProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await sa(`/properties/${id}/approve`, { method: 'PATCH' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-properties'] }),
  });
}
export function useRejectProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => { await sa(`/properties/${id}/reject`, { method: 'PATCH', data: { reason } }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-properties'] }),
  });
}

// ── Owner Verification ────────────────────────────────────────────────────────
export function usePendingOwnerVerifications() {
  return useQuery({ queryKey: ['owner-verifications'], queryFn: async () => { const { data } = await sa('/owner-verifications'); return data.data as any[]; }, staleTime: 30000 });
}
export function useApproveOwnerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await sa(`/owner-verifications/${id}/approve`, { method: 'PATCH' }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-verifications'] }); qc.invalidateQueries({ queryKey: ['super-owners'] }); },
  });
}
export function useRejectOwnerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => { await sa(`/owner-verifications/${id}/reject`, { method: 'PATCH', data: { reason } }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-verifications'] }),
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export function useSuperBookings(params?: Record<string, string>) {
  return useQuery({ queryKey: ['super-bookings', params], queryFn: async () => { const { data } = await sa('/bookings', { params }); return data as any; }, staleTime: 30000 });
}

// ── Revenue ───────────────────────────────────────────────────────────────────
export function usePlatformRevenue() {
  return useQuery({ queryKey: ['platform-revenue'], queryFn: async () => { const { data } = await sa('/revenue'); return data.data as any[]; }, staleTime: 60000 });
}

// ── Hostels ───────────────────────────────────────────────────────────────────
export function useSuperHostels(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['super-hostels', params],
    queryFn: async () => { const { data } = await sa('/hostels', { params }); return data as any; },
    staleTime: 30000,
  });
}
export function useSuperHostelById(id: string | null) {
  return useQuery({
    queryKey: ['super-hostel', id],
    queryFn: async () => { const { data } = await sa(`/hostels/${id}`); return data.data as any; },
    enabled: !!id,
  });
}
export function useCreateHostel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await sa('/hostels', { method: 'POST', data: body }); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-hostels'] }),
  });
}
// 🆕 Combined: creates new owner account + hostel in one call — returns credentials
export function useCreateHostelWithOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await sa('/hostels/create-with-owner', { method: 'POST', data: body });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-hostels'] });
      qc.invalidateQueries({ queryKey: ['super-all-owners'] });
      qc.invalidateQueries({ queryKey: ['super-owners'] });
    },
  });
}
export function useUpdateHostel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => { const { data } = await sa(`/hostels/${id}`, { method: 'PUT', data: body }); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-hostels'] }),
  });
}
export function useToggleHostelActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { data } = await sa(`/hostels/${id}/toggle`, { method: 'PATCH' }); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-hostels'] }),
  });
}
export function useDeleteHostel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await sa(`/hostels/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-hostels'] }),
  });
}

// ── Hostel Admins (Owners for dropdown) ───────────────────────────────────────
export function useSuperAllOwners() {
  return useQuery({
    queryKey: ['super-all-owners'],
    queryFn: async () => { const { data } = await sa('/owners', { params: { limit: '100' } }); return data.data as any[]; },
    staleTime: 60000,
  });
}
export function useCreateOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await sa('/owners', { method: 'POST', data: body }); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-owners'] }); qc.invalidateQueries({ queryKey: ['super-all-owners'] }); },
  });
}

// ── Staff (per hostel) ────────────────────────────────────────────────────────
export function useSuperHostelStaff(hostelId: string | null) {
  return useQuery({
    queryKey: ['super-hostel-staff', hostelId],
    queryFn: async () => { const { data } = await sa(`/hostels/${hostelId}/staff`); return data.data as any[]; },
    enabled: !!hostelId,
  });
}
export function useCreateStaffUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await sa('/staff', { method: 'POST', data: body }); return data; },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['super-hostel-staff', vars.hostelId] }),
  });
}

// ── Owner Permissions (SuperAdmin → HOSTEL_ADMIN module access) ───────────────
export function useSetOwnerPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ownerId, permissions }: { ownerId: string; permissions: Record<string, boolean> }) => {
      const { data } = await sa(`/owners/${ownerId}/permissions`, { method: 'PATCH', data: permissions });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-all-owners'] });
      qc.invalidateQueries({ queryKey: ['super-owners'] });
    },
  });
}

// ── Staff Permissions (Owner → staff feature access via hostelAdmin route) ─────
export function useUpdateStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, permissions }: { staffId: string; permissions: Record<string, boolean> }) => {
      const { data } = await apiClient({
        url: `/hostel-admin/staff/${staffId}/permissions`,
        method: 'PUT',
        data: { permissions },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['login-staff'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

