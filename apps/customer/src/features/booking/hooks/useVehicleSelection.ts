import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { getActiveCustomerRide, getCustomerVehicles } from '../api';
import { useBookingDraft } from '../store';
import { useRoutePreview } from './useRoutePreview';
export function useVehicleSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const draft = useBookingDraft();
  const [selectedId, setSelectedId] = useState(draft.vehicleId);
  const vehicles = useQuery({ queryKey: ['customer', 'getCustomerVehicles'], queryFn: getCustomerVehicles });
  const active = useQuery({ queryKey: ['customer', 'getActiveCustomerRide'], queryFn: getActiveCustomerRide, staleTime: 0 });
  useRefreshOnFocus(vehicles.refetch); useRefreshOnFocus(active.refetch);
  const selected = vehicles.data?.find(vehicle => vehicle.id === selectedId) ?? vehicles.data?.[0];
  const route = useRoutePreview(draft.pickup, draft.dropoff);
  const canContinue = Boolean(draft.pickup && draft.dropoff && selected && active.isSuccess && !active.isFetching && !active.data);
  const continueBooking = () => {
    if (!canContinue || !selected) return;
    draft.setVehicle(selected.id);
    if (params.edit === '1') router.dismissTo('/ride/confirm');
    else router.push('/ride/confirm');
  };
  return { router, draft, vehicles: vehicles.data ?? [], loading: vehicles.isLoading, error: vehicles.error?.message ?? active.error?.message ?? '', refresh: () => { void vehicles.refetch(); void active.refetch(); }, activeRide: active.data, selected, setSelectedId, canContinue, continueBooking, route: route.data };
}
