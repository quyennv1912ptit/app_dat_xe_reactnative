import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INITIAL_PHOTOS,PhotoSource,PhotoTarget,TARGET_DETAILS } from '../components/VerifyIdScreenParts';
export function useVerifyId() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [fullName, setFullName] = useState('NGUYỄN VĂN AN');
const [citizenId, setCitizenId] = useState('079092019482');
const [photos, setPhotos] = useState(INITIAL_PHOTOS);
const [busyTarget, setBusyTarget] = useState<PhotoTarget | null>(null);
const [selfieMatched, setSelfieMatched] = useState(true);
const [notice, setNotice] = useState('');
const updatePhoto = (target: PhotoTarget, asset: ImagePicker.ImagePickerAsset) => {
    const fileSize = asset.fileSize;
    const sizeLabel =
      fileSize === undefined
        ? 'Ảnh mới'
        : `${Math.max(fileSize / (1024 * 1024), 0.1).toFixed(1)} MB`;

    setPhotos((current) => ({
      ...current,
      [target]: { uri: asset.uri, sizeLabel },
    }));
    if (target === 'selfie') setSelfieMatched(false);
    setNotice('');
  };
const openPhotoSource = async (target: PhotoTarget, source: PhotoSource) => {
    if (busyTarget) return;
    setBusyTarget(target);

    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cần quyền sử dụng camera',
            'Hãy cấp quyền camera để chụp giấy tờ và ảnh chân dung xác minh.',
          );
          return;
        }
      }

      const { aspect } = TARGET_DETAILS[target];
      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect,
        mediaTypes: ['images'],
        quality: 0.9,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        updatePhoto(target, result.assets[0]);
      }
    } catch {
      Alert.alert('Không thể mở ảnh', 'Vui lòng thử chụp hoặc chọn ảnh khác.');
    } finally {
      setBusyTarget(null);
    }
  };
const choosePhoto = (target: PhotoTarget) => {
    if (busyTarget) return;
    const label = TARGET_DETAILS[target].label;

    Alert.alert(`Cập nhật ${label}`, 'Chọn cách thêm ảnh xác minh.', [
      {
        text: 'Chụp ảnh',
        onPress: () => void openPhotoSource(target, 'camera'),
      },
      {
        text: 'Chọn từ thư viện',
        onPress: () => void openPhotoSource(target, 'library'),
      },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };
const submitVerification = () => {
    if (!fullName.trim()) {
      setNotice('Vui lòng nhập họ và tên đúng như trên thẻ CCCD.');
      return;
    }
    if (citizenId.length !== 12) {
      setNotice('Số căn cước công dân cần có đủ 12 chữ số.');
      return;
    }
    if (!selfieMatched) {
      setNotice('Ảnh chân dung mới cần được đối sánh trước khi gửi xác minh.');
      return;
    }

    setNotice('');
    router.push('/(auth)/approval-status' as never);
  };
return { router, insets, fullName, setFullName, citizenId, setCitizenId, photos, busyTarget, selfieMatched, notice, setNotice, choosePhoto, submitVerification };
}
