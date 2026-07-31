import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../api/authApi';
import { isLoggedIn } from '../api/authToken';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: isLoggedIn(),
    retry: false,
    staleTime: 60_000,
  });
};
