import { useLanguage , useThemeColors , useThemedStyles  } from '@datxe/ui';
import { Redirect } from 'expo-router';
import { ActivityIndicator,View } from 'react-native';
import { styles as base_styles } from '../components/SessionGateScreenParts';
import { useSessionGate } from '../hooks/useSessionGate';
export default function Index() {
 useLanguage();

 const colors=useThemeColors();

 const styles=useThemedStyles(base_styles);

const { destination } = useSessionGate();
if (destination) return <Redirect href={destination as never} />;
return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
