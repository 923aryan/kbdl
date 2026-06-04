import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

// 6. Get Employer Profile
export const useGetEmployerVerificationStatus = (): UseQueryResult<
  { is_verified: boolean },
  Error
> => {
  return useQuery({
    queryKey: ['employer-profile'],
    queryFn: async () => {
      const response = await api.get<{ is_verified: boolean }>(
        '/profile/employers/me/verification-status',
      );
      return response.data;
    },
  });
};
