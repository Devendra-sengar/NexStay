import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface OccupancyFilters {
  propertyId?: string;
  date?: string;
}

export interface RevenueFilters {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}

export interface BookingFilters {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useOccupancyReport = (filters: OccupancyFilters) =>
  useQuery({
    queryKey: ['reports', 'occupancy', filters],
    queryFn: () =>
      api.get('/reports/occupancy', { params: filters }).then(r => r.data.data),
  });

export const useRevenueReport = (filters: RevenueFilters) =>
  useQuery({
    queryKey: ['reports', 'revenue', filters],
    queryFn: () =>
      api.get('/reports/revenue', { params: filters }).then(r => r.data.data),
  });

export const useBookingReport = (filters: BookingFilters) =>
  useQuery({
    queryKey: ['reports', 'bookings', filters],
    queryFn: () =>
      api.get('/reports/bookings', { params: filters }).then(r => r.data.data),
  });
