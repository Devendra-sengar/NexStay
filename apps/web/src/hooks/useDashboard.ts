import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
  });

export const useRevenueChart = () =>
  useQuery({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: () => api.get('/dashboard/revenue-chart').then(r => r.data.data),
  });

export const useRecentBookings = () =>
  useQuery({
    queryKey: ['dashboard', 'recent-bookings'],
    queryFn: () => api.get('/dashboard/recent-bookings').then(r => r.data.data),
  });

export const useRecentComplaints = () =>
  useQuery({
    queryKey: ['dashboard', 'recent-complaints'],
    queryFn: () => api.get('/dashboard/recent-complaints').then(r => r.data.data),
  });
