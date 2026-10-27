import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INITIAL_SLOTS } from '../components/VehicleInspectionScreenParts';
export function useVehicleInspection() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [slots, setSlots] = useState(INITIAL_SLOTS);
const [notes, setNotes] = useState('');
const [capturingIndex, setCapturingIndex] = useState<number | null>(null);
const capturedCount = slots.filter((slot) => slot.image).length;
const capturePhoto = async (slotIndex: number) => {
    if (capturingIndex !== null) return;
    setCapturingIndex(slotIndex);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Cần quyền sử dụng camera',
          'Cho phép truy cập camera để chụp ảnh biên bản bàn giao xe.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        mediaTypes: ['images'],
        quality: 0.9,
      });
      const photo = result.canceled ? undefined : result.assets[0]?.uri;
      if (photo) {
        setSlots((current) =>
          current.map((slot, index) =>
            index === slotIndex ? { ...slot, image: photo } : slot,
          ),
        );
      }
    } catch {
      Alert.alert('Không thể mở camera', 'Vui lòng thử chụp lại ảnh.');
    } finally {
      setCapturingIndex(null);
    }
  };
const appendNote = (preset: string) => {
    setNotes((current) =>
      current.trim() ? current.trimEnd() + ', ' + preset.toLowerCase() : preset,
    );
  };
const submitHandover = () => {
    if (capturedCount < slots.length) {
      Alert.alert(
        'Chưa chụp đủ ảnh',
        'Bạn chưa chụp đủ 6 góc xe. Xác nhận bỏ qua các góc còn lại để tiếp tục?',
        [
          { text: 'Tiếp tục chụp', style: 'cancel' },
          {
            text: 'Xác nhận bàn giao',
            onPress: () =>
              Alert.alert('Đã xác nhận', 'Biên bản xe đã được lưu thành công.', [
                { text: 'Đóng', onPress: () => router.back() },
              ]),
          },
        ],
      );
      return;
    }

    Alert.alert('Đã xác nhận', 'Biên bản xe đã được lưu thành công.', [
      { text: 'Đóng', onPress: () => router.back() },
    ]);
  };
return { router, insets, slots, notes, setNotes, capturingIndex, capturedCount, capturePhoto, appendNote, submitHandover };
}
