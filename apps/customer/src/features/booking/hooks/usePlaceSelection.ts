import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard } from 'react-native';
import { getCustomerRides, searchBookingPlaces } from '../api';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';
import { useBookingDraft } from '../store';
import type { BookingPlace, PlaceKind } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import { useDeviceLocation } from './useDeviceLocation';

export function usePlaceSelection(kind: PlaceKind) {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const edit = params.edit === '1';
  const draft = useBookingDraft();
  const [text, setText] = useState(kind === 'dropoff' ? draft.destinationHint : '');
  const queryText = text.trim();
  const debounced = useDebouncedValue(queryText);
  const proximity = draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER;
  const searching = queryText.length >= 2 && queryText !== debounced;
  const canSearch = queryText.length >= 2 && !searching;
  const search = useQuery({ queryKey: ['customer', 'placeSearch', debounced, proximity.lat, proximity.lng], queryFn: ({ signal }) => searchBookingPlaces(debounced, proximity, signal), enabled: canSearch, retry: false, staleTime: 60000 });
  const recent = useQuery({ queryKey: ['customer', 'bookingRecentPlaces'], queryFn: () => getCustomerRides(0, 10), staleTime: 60000 });
  const recentAddresses = [...new Set(recent.data?.content.flatMap(ride => (kind === 'pickup' ? ride.pickupAddress : ride.dropoffAddress) || []).filter(Boolean) ?? [])].slice(0, 4);
  const device = useDeviceLocation();
  const select = (place: BookingPlace) => {
    Keyboard.dismiss(); draft.setPlace(kind, place);
    if (edit) router.dismissTo('/ride/confirm');
    else router.push(kind === 'pickup' ? '/ride/destination' : '/ride/vehicle');
  };
  const useCurrentLocation = async () => { const place = await device.locate(); if (place) select(place); };
  const openMap = () => { Keyboard.dismiss(); router.push({ pathname: '/ride/map-picker', params: { kind, edit: edit ? '1' : '0' } }); };
  return { router, text, setText, selected: draft[kind], pickup: draft.pickup, results: canSearch ? search.data ?? [] : [], loading: searching || (canSearch && search.isFetching), error: canSearch ? search.error?.message : '', recentAddresses, select, openMap, useCurrentLocation, ...device };
}
