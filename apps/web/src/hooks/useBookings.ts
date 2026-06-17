import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useStudentBookings = () =>
  useQuery({
    queryKey: ['student-bookings'],
    queryFn: () => api.get('/bookings/student/my').then(r => r.data.data),
  });

export const useCreateStudentBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingData: {
      propertyId: string;
      roomId: string;
      bedId: string;
      guardianName?: string;
      guardianPhone?: string;
      documents?: {
        aadhaar?: string;
        studentId?: string;
        photo?: string;
      };
    }) => api.post('/bookings/student', bookingData).then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
};

export const useRoomBeds = (roomId: string) =>
  useQuery({
    queryKey: ['room-beds', roomId],
    queryFn: () => api.get(`/beds/room/${roomId}`).then(r => r.data.data),
    enabled: !!roomId,
  });

