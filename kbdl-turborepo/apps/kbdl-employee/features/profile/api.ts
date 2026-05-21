import { api } from "@/lib/api/api-client";
import { UpdateUserProfilePayload, UpdateUserProfileResponse } from "@repo/types";
import { useMutation } from "@tanstack/react-query";

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (payload: UpdateUserProfilePayload) => {
      console.log("payload was ", payload)
      const response = await api.patch<UpdateUserProfileResponse>('/profile/users/me', payload);
      return response.data;
    },
  });
};