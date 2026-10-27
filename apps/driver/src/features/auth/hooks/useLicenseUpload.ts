import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageSource,LicenseSide,LicenseTier } from '../components/LicenseUploadScreenParts';
export function useLicenseUpload() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [frontImage, setFrontImage] = useState<string | null>(null);
const [backImage, setBackImage] = useState<string | null>(null);
const [licenseNumber, setLicenseNumber] = useState('0790 9400 8129');
const [tier, setTier] = useState<LicenseTier>('B2');
const [issueDate, setIssueDate] = useState('14/08/2021');
const [expiryDate, setExpiryDate] = useState('14/08/2031');
const [busySide, setBusySide] = useState<LicenseSide | null>(null);
const [notice, setNotice] = useState('');
const openImageSource = async (side: LicenseSide, source: ImageSource) => {
    if (busySide) return;
    setBusySide(side);

    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cần quyền sử dụng camera',
            'Hãy cấp quyền camera để chụp ảnh giấy phép lái xe.',
          );
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              mediaTypes: ['images'],
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [4, 3],
              mediaTypes: ['images'],
              quality: 0.9,
            });

      if (!result.canceled && result.assets[0]) {
        if (side === 'front') setFrontImage(result.assets[0].uri);
        else setBackImage(result.assets[0].uri);
        setNotice('');
      }
    } catch {
      Alert.alert('Không thể mở ảnh', 'Vui lòng thử chụp hoặc chọn ảnh khác.');
    } finally {
      setBusySide(null);
    }
  };
const chooseImage = (side: LicenseSide) => {
    if (busySide) return;
    const sideLabel = side === 'front' ? 'mặt trước' : 'mặt sau';

    Alert.alert(`Ảnh ${sideLabel} GPLX`, 'Chọn cách thêm ảnh giấy phép.', [
      {
        text: 'Chụp ảnh',
        onPress: () => void openImageSource(side, 'camera'),
      },
      {
        text: 'Chọn từ thư viện',
        onPress: () => void openImageSource(side, 'library'),
      },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };
const updateLicenseNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    setLicenseNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
    setNotice('');
  };
const submitForReview = () => {
    if (!frontImage || !backImage) {
      setNotice('Vui lòng tải ảnh rõ nét của cả mặt trước và mặt sau GPLX.');
      return;
    }

    if (licenseNumber.replace(/\D/g, '').length !== 12) {
      setNotice('Số giấy phép lái xe cần có đủ 12 chữ số.');
      return;
    }

    setNotice('');
    router.push('/(auth)/verify-id' as never);
  };
return { router, insets, frontImage, backImage, licenseNumber, tier, setTier, issueDate, setIssueDate, expiryDate, setExpiryDate, busySide, notice, setNotice, chooseImage, updateLicenseNumber, submitForReview };
}
