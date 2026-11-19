import { translate as i18nT } from '@datxe/shared';
import {
  Button,
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { money } from '../bookingUtils';
import { checkoutStyles } from './checkoutStyles';

type PaymentMethod = 'CASH' | 'WALLET';

export function PaymentMethodModal({
  visible,
  close,
  method,
  onChange,
  balance,
  error,
  submitting,
  onTopUp,
  onRetryWallet,
}: {
  visible: boolean;
  close: () => void;
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  balance?: number;
  error?: string;
  submitting: boolean;
  onTopUp: () => void;
  onRetryWallet: () => void;
}) {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(checkoutStyles);
  const insets = useSafeAreaInsets();

  const option = (
    value: PaymentMethod,
    icon: keyof typeof MaterialIcons.glyphMap,
    title: string,
    meta: string,
  ) => {
    const active = method === value;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: active, checked: active, disabled: submitting }}
        disabled={submitting}
        onPress={() => onChange(value)}
        style={[s.paymentRow, active && s.paymentRowActive]}
      >
        <View style={s.paymentIcon}>
          <MaterialIcons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={s.paymentCopy}>
          <Text style={s.paymentTitle}>{i18nT(title)}</Text>
          <Text style={s.paymentMeta}>{meta}</Text>
        </View>
        <MaterialIcons
          name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
          size={24}
          color={active ? colors.primary : colors.outline}
        />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={close}>
      <View style={s.modalScrim}>
        <Pressable accessibilityLabel={i18nT('Đóng')} style={{ flex: 1 }} onPress={close} />
        <ScrollView
          style={s.modalScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.modalSheet, { paddingBottom: Math.max(26, insets.bottom + 12) }]}
        >
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{i18nT('Phương thức thanh toán')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT('Đóng')}
              onPress={close}
              style={s.modalClose}
            >
              <MaterialIcons name="close" size={21} color={colors.onSurface} />
            </Pressable>
          </View>

          {option('CASH', 'payments', 'Tiền mặt', i18nT('Trả trực tiếp cho tài xế'))}
          {option(
            'WALLET',
            'account-balance-wallet',
            'Ví ứng dụng',
            balance === undefined
              ? i18nT('Chưa tải được số dư ví')
              : `${i18nT('Số dư ví')}: ${money(balance)}`,
          )}

          {error ? (
            <View style={s.errorBox}>
              <Text accessibilityRole="alert" style={s.errorText}>{i18nT(error)}</Text>
            </View>
          ) : null}

          {method === 'WALLET' ? (
            <View style={s.paymentActions}>
              <Button variant="secondary" label="Nạp tiền vào ví" disabled={submitting} onPress={onTopUp} />
              <Button variant="ghost" label="Kiểm tra lại số dư" disabled={submitting} onPress={onRetryWallet} />
            </View>
          ) : null}

          <Button label="Xong" disabled={submitting} onPress={close} />
        </ScrollView>
      </View>
    </Modal>
  );
}
