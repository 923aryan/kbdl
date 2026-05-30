import { api } from '@/lib/api/api-client';
import {
  UpdateUserLocationPayload,
  UpdateUserLocationResponse,
  UpdateUserProfilePayload,
  UpdateUserProfileResponse,
} from '@repo/types';
import { useMutation } from '@tanstack/react-query';

export const updateUserProfile = async (payload: UpdateUserProfilePayload) => {
  console.log('payload was ', payload);
  const response = await api.patch<UpdateUserProfileResponse>('/profile/users/me', payload);
  return response.data;
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: updateUserProfile,
  });
};

export const updateUserLocation = async (payload: UpdateUserLocationPayload) => {
  console.log('payload for updating locaiton ', payload);
  const response = await api.patch<UpdateUserLocationResponse>(
    '/profile/users/me/location',
    payload,
  );
  return response.data;
};

export const useUpdateUserLocation = () => {
  return useMutation({
    mutationFn: updateUserLocation,
  });
};
