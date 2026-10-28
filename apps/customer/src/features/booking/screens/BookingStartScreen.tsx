import { ActivityIndicator, View } from 'react-native';
import { useBookingStart } from '../hooks/useBookingStart';
export default function BookingStartScreen() {
  useBookingStart();
  return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
}
