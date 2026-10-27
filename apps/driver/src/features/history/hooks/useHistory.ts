import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryFilter,TripRecord,TRIPS } from '../components/HistoryScreenParts';
export function useHistory() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [filter, setFilter] = useState<HistoryFilter>('all');
const [inspectionOpen, setInspectionOpen] = useState(false);
const [selectedTrip, setSelectedTrip] = useState<TripRecord>(TRIPS[0]);
const visibleTrips = TRIPS.filter((trip) => {
    if (filter === 'today') return trip.today;
    if (filter === 'week') return trip.week;
    return true;
  });
const openInspection = (trip: TripRecord) => {
    setSelectedTrip(trip);
    setInspectionOpen(true);
  };
return { router, insets, filter, setFilter, inspectionOpen, setInspectionOpen, selectedTrip, visibleTrips, openInspection };
}
