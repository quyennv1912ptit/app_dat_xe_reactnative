import { translate as i18nT } from '@datxe/shared';
import { useLanguage } from "../useLanguage";
import { useThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/ThemeProvider";
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable,StyleSheet } from 'react-native';

import { borderRadius,colors,fontSize,spacing } from '../theme/colors';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function AuthBackButton({ onPress, accessibilityLabel = i18nT("Quay lại") }: Props) {
 useLanguage();

 const colors=useThemeColors();

 const styles=useThemedStyles(base_styles);

  return (
    <Pressable
      accessibilityLabel={i18nT(accessibilityLabel)}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <MaterialIcons color={colors.onSurface} name="arrow-back" size={fontSize.iconXl} />
    </Pressable>
  );
}

const base_styles = StyleSheet.create({
  button: {
    width: spacing.iconButtonMd,
    height: spacing.iconButtonMd,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
