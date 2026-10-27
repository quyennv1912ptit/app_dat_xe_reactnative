import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CUSTOMER_PHONE,MapTool,STEP_COPY,TRIP_STEPS } from '../components/InProgressScreenParts';
export function useInProgress() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [activeStep, setActiveStep] = useState(0);
const [tripCompleted, setTripCompleted] = useState(false);
const [voiceEnabled, setVoiceEnabled] = useState(true);
const [mapNotice, setMapNotice] = useState('');
const [trafficLayerEnabled, setTrafficLayerEnabled] = useState(false);
const [handoverPhoto, setHandoverPhoto] = useState<string | null>(null);
const [capturingPhoto, setCapturingPhoto] = useState(false);
const openCustomerCall = async () => {
    try {
      await Linking.openURL(`tel:${CUSTOMER_PHONE}`);
    } catch {
      Alert.alert('Không thể gọi khách', `Vui lòng gọi ${CUSTOMER_PHONE}.`);
    }
  };
const openSupport = () => {
    Alert.alert('Hỗ trợ chuyến đi', 'Bạn muốn gọi tổng đài đối tác 1900 6868?', [
      { text: 'Để sau', style: 'cancel' },
      {
        text: 'Gọi tổng đài',
        onPress: () => {
          void Linking.openURL('tel:19006868').catch(() =>
            Alert.alert('Không thể gọi tổng đài', 'Vui lòng gọi 1900 6868.'),
          );
        },
      },
    ]);
  };
const captureHandoverPhoto = async () => {
    if (capturingPhoto) return;
    setCapturingPhoto(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Cần quyền sử dụng camera',
          'Cho phép truy cập camera để chụp biên bản tình trạng xe.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setHandoverPhoto(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Không thể mở camera', 'Vui lòng thử chụp lại biên bản.');
    } finally {
      setCapturingPhoto(false);
    }
  };
const advanceTrip = () => {
    if (tripCompleted) return;

    if (activeStep < TRIP_STEPS.length - 1) {
      setActiveStep((step) => step + 1);
      return;
    }

    setTripCompleted(true);
    router.push('/ride/complete' as never);
  };
const onMapToolPress = (tool: MapTool) => {
    if (tool === 'layers') {
      setMapNotice('Bản đồ đường phố');
      return;
    }

    if (tool === 'location') {
      setMapNotice('Đã căn giữa vị trí tài xế');
      return;
    }

    setTrafficLayerEnabled((enabled) => !enabled);
    setMapNotice(trafficLayerEnabled ? 'Đã tắt lớp giao thông' : 'Giao thông: thông thoáng');
  };
const currentStepCopy = STEP_COPY[activeStep];
return { router, insets, activeStep, tripCompleted, voiceEnabled, setVoiceEnabled, mapNotice, trafficLayerEnabled, handoverPhoto, capturingPhoto, openCustomerCall, openSupport, captureHandoverPhoto, advanceTrip, onMapToolPress, currentStepCopy };
}
