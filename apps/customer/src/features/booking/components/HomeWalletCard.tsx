import { formatMoney, translate as t } from '@datxe/shared';
import {
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { homeStyles } from './homeStyles';

/** Tầng 2: thẻ ví fintech full-width, không còn pill lồng pill. */
export function HomeWalletCard({
  balance,
  walletLoading,
  walletError,
  onWallet,
  onTopUp,
}: {
  balance?: number;
  walletLoading: boolean;
  walletError: boolean;
  onWallet: () => void;
  onTopUp: () => void;
}) {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(homeStyles);
  const balanceText = balance !== undefined
    ? formatMoney(balance, { nonBreaking: true })
    : walletError
      ? t('Chưa tải được')
      : walletLoading
        ? t('Đang tải số dư…')
        : t('Chưa tải được');

  return (
    <View style={s.walletCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('Số dư ví')}: ${balanceText}`}
        onPress={onWallet}
        style={s.walletLeft}
      >
        <View style={s.walletIcon}>
          <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
        </View>
        <View style={s.walletCopy}>
          <Text style={s.walletLabel}>{t('Số dư ví')}</Text>
          <Text textBreakStrategy="simple" style={s.walletBalance}>
            {balanceText}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Nạp tiền vào ví')}
        onPress={onTopUp}
        style={s.walletAction}
        hitSlop={4}
      >
        <MaterialIcons name="add" size={16} color={colors.primary} />
        <Text style={s.walletActionText}>{t('Nạp tiền')}</Text>
      </Pressable>
    </View>
  );
}
