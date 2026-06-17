import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useExpenses = (params?: {
  propertyId?: string; category?: string; month?: number; year?: number; page?: number;
}) =>
  useQuery({
    queryKey: ['expenses', params],
    queryFn: () => api.get('/expenses', { params }).then(r => r.data),
  });

export const useExpenseBreakdown = (params?: { propertyId?: string; month?: number; year?: number }) =>
  useQuery({
    queryKey: ['expenses', 'breakdown', params],
    queryFn: () => api.get('/expenses/breakdown', { params }).then(r => r.data.data),
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/expenses', data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/expenses/${id}`, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};
