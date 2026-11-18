import { translate as i18nT } from '@datxe/shared';
import {
  Button,
  MotionPressable as Pressable,
  ThemedTextInput as TextInput,
  Typography as Text,
  useLanguage,
  useThemedStyles,
} from '@datxe/ui';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { placeStyles } from './placeStyles';
const REASONS = [
  'Tên địa chỉ sai',
  'Địa chỉ đã đóng cửa',
  'Vị trí ghim sai',
  'Địa chỉ không tồn tại',
] as const;

/** Gửi phản hồi về địa chỉ; backend tạo ticket hỗ trợ loại OTHER. */
export function ReportPlaceSheet({
  visible,
  address,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  address: string;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  useLanguage();
  const { bottom } = useSafeAreaInsets();
  const s = useThemedStyles(placeStyles);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [selected, setSelected] = useState<string>('');
  const [details, setDetails] = useState('');

  const close = () => {
    setSelected('');
    setDetails('');
    onClose();
  };

  const reason = [selected ? i18nT(selected) : '', details.trim()].filter(Boolean).join(': ');
  const canSubmit = reason.length >= 5 && !submitting;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={close}>
      <View style={s.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18nT('Đóng')}
          style={s.modalDismiss}
          onPress={close}
        />
        <KeyboardAvoidingView style={{ maxHeight: "95%" }} behavior="padding">
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}
          contentContainerStyle={[s.modalSheet, { paddingBottom: bottom + 16 }]}>
            <Text style={s.modalTitle}>{i18nT('Báo lỗi địa chỉ')}</Text>
            <Text numberOfLines={2} style={s.modalDescription}>{address}</Text>
            <Text style={s.feedbackTitleText}>{i18nT('Lý do')}</Text>
            <View style={s.reasonChips}>
              {REASONS.map((item) => {
                const active = selected === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="radio"
                    accessibilityLabel={i18nT(item)}
                    accessibilityState={{ selected: active }}
                    onPress={() => setSelected(item)}
                    style={[s.reasonChip, active && s.reasonChipActive]}
                  >
                    <Text style={s.reasonChipText}>{i18nT(item)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              accessibilityLabel={i18nT('Mô tả lỗi (không bắt buộc)')}
              value={details}
              onChangeText={setDetails}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
              placeholder={i18nT('Mô tả lỗi (không bắt buộc)')}
              multiline
              maxLength={500}
              style={s.modalInput}
            />
            {error ? <Text accessibilityRole="alert" style={s.errorText}>{i18nT(error)}</Text> : null}
            <View style={s.modalActions}>
              <Button variant="secondary" label="Hủy" onPress={close} style={s.modalButton} />
              <Button
                label="Gửi báo lỗi"
                loading={submitting}
                disabled={!canSubmit}
                onPress={() => { void onSubmit(reason); }}
                style={s.modalButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
