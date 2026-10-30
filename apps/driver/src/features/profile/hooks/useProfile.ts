import { useQuery } from '@tanstack/react-query';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { profileApi } from '../api';
export function useProfile(){const profile=useQuery({queryKey:['driver','profile'],queryFn:profileApi.profile});const verification=useQuery({queryKey:['driver','verification'],queryFn:profileApi.verification});const wallet=useQuery({queryKey:['driver','wallet'],queryFn:profileApi.wallet});useRefreshOnFocus(profile.refetch);useRefreshOnFocus(verification.refetch);useRefreshOnFocus(wallet.refetch);return {profile,verification,wallet};}
