import { colors } from '@datxe/ui';
import { Redirect } from 'expo-router';
import { ActivityIndicator,View } from 'react-native';
import { styles } from '../components/SessionGateScreenParts';
import { useSessionGate } from '../hooks/useSessionGate';
export default function Index() {
const { destination } = useSessionGate();
if (destination) return <Redirect href={destination as never} />;
return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
