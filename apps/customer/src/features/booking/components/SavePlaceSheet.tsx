import { translate as i18nT } from '@datxe/shared';
import {
  Button,
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemedStyles,
} from '@datxe/ui';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { placeStyles } from './placeStyles';

const SAVED_LABELS = ['Nhà', 'Cơ quan', 'Yêu thích'] as const;

/** Chọn nhãn nhanh khi lưu địa điểm, đồng bộ với mục "Địa điểm đã lưu" trong Cài đặt. */
export function SavePlaceSheet({
  visible,
  address,
  onClose,
  onSave,
}: {
  visible: boolean;
  address: string;
  onClose: () => void;
  onSave: (label: string) => void;
}) {
  useLanguage();
  const { bottom } = useSafeAreaInsets();
  const s = useThemedStyles(placeStyles);
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18nT('Đóng')}
          style={s.modalDismiss}
          onPress={onClose}
        />
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, maxHeight: "95%" }}
          contentContainerStyle={[s.modalSheet, { paddingBottom: bottom + 16 }]}>
          <Text style={s.modalTitle}>{i18nT('Lưu địa điểm')}</Text>
          <Text numberOfLines={2} style={s.modalDescription}>{address}</Text>
          {SAVED_LABELS.map((label) => (
            <Button
              key={label}
              variant="secondary"
              label={i18nT('Lưu {0}', { 0: i18nT(label) })}
              icon={label === 'Nhà' ? 'home' : label === 'Cơ quan' ? 'work' : 'star'}
              iconPosition="leading"
              onPress={() => onSave(label)}
            />
          ))}
          <Button variant="ghost" label="Hủy" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}
