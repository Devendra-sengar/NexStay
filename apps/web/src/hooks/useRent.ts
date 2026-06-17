import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useRentStats = () =>
  useQuery({ queryKey: ['rent', 'stats'], queryFn: () => api.get('/rent/stats').then(r => r.data.data) });

export const useRentRecords = (params?: {
  propertyId?: string; status?: string; search?: string; from?: string; to?: string; page?: number;
}) =>
  useQuery({
    queryKey: ['rent', 'records', params],
    queryFn: () => api.get('/rent', { params }).then(r => r.data),
  });

export const useRentRecord = (id: string) =>
  useQuery({
    queryKey: ['rent', 'record', id],
    queryFn: () => api.get(`/rent/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

export const useRentGenerationPreview = () =>
  useQuery({
    queryKey: ['rent', 'generate', 'preview'],
    queryFn: () => api.get('/rent/generate/preview').then(r => r.data.data),
  });

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.post(`/rent/${id}/pay`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rent'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useGenerateMonthlyRent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { rentAmount?: number }) =>
      api.post('/rent/generate', data || {}).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rent'] }),
  });
};

export const useSendReminder = () =>
  useMutation({
    mutationFn: (id: string) => api.post(`/rent/${id}/remind`).then(r => r.data),
  });
