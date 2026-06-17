import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useHomeData = () =>
  useQuery({
    queryKey: ['marketplace', 'home'],
    queryFn: () => api.get('/marketplace/home').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

export const useSearchProperties = (params: {
  q?: string; city?: string; minPrice?: number; maxPrice?: number;
  gender?: string; amenities?: string; sort?: string; page?: number;
}) =>
  useQuery({
    queryKey: ['marketplace', 'search', params],
    queryFn: () => api.get('/marketplace/search', { params }).then(r => r.data),
    enabled: true,
  });

export const usePropertyPublicDetail = (id: string) =>
  useQuery({
    queryKey: ['marketplace', 'property', id],
    queryFn: () => api.get(`/marketplace/properties/${id}`).then(r => r.data.data),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
