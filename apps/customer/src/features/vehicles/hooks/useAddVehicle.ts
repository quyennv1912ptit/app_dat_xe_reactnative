import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { Alert } from 'react-native';
import { createCustomerVehicle,deleteCustomerVehicleImage,getCustomerVehicles,updateCustomerVehicle,uploadCustomerVehicleImage } from '../api';
export function useAddVehicle() {
const router = useRouter();
const params = useLocalSearchParams<{ vehicleId?: string }>();
const vehicleId = Number(Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId) || null;
const [plate, setPlate] = useState('');
const [brand, setBrand] = useState('');
const [model, setModel] = useState('');
const [color, setColor] = useState('');
const [engine, setEngine] = useState('');
const [transmission, setTransmission] = useState<'MANUAL' | 'AUTO'>('AUTO');
const [vehicleType, setVehicleType] = useState<'CAR' | 'MOTORCYCLE'>('CAR');
const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
const [existingImages, setExistingImages] = useState<{ id: number; secure_url: string }[]>([]);
const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
const [saving, setSaving] = useState(false);
const [loadingVehicle, setLoadingVehicle] = useState(Boolean(vehicleId));
useEffect(() => {
    if (!vehicleId) return;
    let alive = true;
    getCustomerVehicles().then((vehicles) => {
      const current = vehicles.find((item) => item.id === vehicleId);
      if (!alive) return;
      if (!current) { Alert.alert('Không tìm thấy xe', 'Xe này không còn trong tài khoản.'); return; }
      setPlate(current.plate_number ?? '');
      setBrand(current.brand ?? '');
      setModel(current.model ?? '');
      setColor(current.color ?? '');
      setEngine(current.engine_cc === null ? '' : String(current.engine_cc));
      setTransmission(current.transmission_type === 'MANUAL' ? 'MANUAL' : 'AUTO');
      setVehicleType(current.vehicle_type === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR');
      setExistingImages(current.images);
    }).catch((error: unknown) => {
      if (alive) Alert.alert('Không tải được xe', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }).finally(() => alive && setLoadingVehicle(false));
    return () => { alive = false; };
  }, [vehicleId]);
const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (!result.canceled) setPhoto(result.assets[0] ?? null);
  };
const removeImage = (imageId: number) => Alert.alert('Xóa ảnh xe', 'Bạn muốn xóa ảnh này khỏi phương tiện?', [
    { text: 'Giữ lại', style: 'cancel' },
    { text: 'Xóa ảnh', style: 'destructive', onPress: () => { void (async () => {
      if (!vehicleId || deletingImageId) return;
      setDeletingImageId(imageId);
      try {
        await deleteCustomerVehicleImage(vehicleId, imageId);
        setExistingImages((items) => items.filter((item) => item.id !== imageId));
      } catch (error) {
        Alert.alert('Không thể xóa ảnh', error instanceof Error ? error.message : 'Vui lòng thử lại.');
      } finally {
        setDeletingImageId(null);
      }
    })(); } },
  ]);
const save = async () => {
    if (!plate.trim()) {
      Alert.alert('Thiếu biển số', 'Nhập biển số xe để lưu.');
      return;
    }
    if (plate.trim().length > 20 || brand.trim().length > 100 || model.trim().length > 100 || color.trim().length > 50) {
      Alert.alert('Thông tin vượt giới hạn', 'Biển số tối đa 20 ký tự, hãng/dòng xe tối đa 100 ký tự và màu xe tối đa 50 ký tự.');
      return;
    }
    const engineCc = engine.trim() ? Number(engine) : null;
    if (engineCc !== null && (!/^\d+$/.test(engine.trim()) || !Number.isSafeInteger(engineCc) || engineCc <= 0 || engineCc > 2_147_483_647)) {
      Alert.alert('Dung tích không hợp lệ', 'Nhập số nguyên cc lớn hơn 0.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        plate_number: plate.trim().toUpperCase(),
        transmission_type: transmission,
        vehicle_type: vehicleType,
        engine_cc: engineCc,
        brand: brand.trim() || null,
        model: model.trim() || null,
        color: color.trim() || null,
      };
      const vehicle = vehicleId
        ? await updateCustomerVehicle(vehicleId, payload)
        : await createCustomerVehicle(payload);
      if (photo) {
        try {
          await uploadCustomerVehicleImage(vehicle.id, { uri: photo.uri, fileName: photo.fileName, mimeType: photo.mimeType });
        } catch (photoError) {
          Alert.alert('Xe đã lưu, ảnh chưa tải lên', photoError instanceof Error ? photoError.message : 'Bạn có thể thử tải ảnh lại sau.');
          router.back();
          return;
        }
      }
      Alert.alert(vehicleId ? 'Đã cập nhật xe' : 'Đã lưu xe', 'Thông tin xe đã được lưu vào tài khoản.', [{ text: 'Đóng', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Không thể lưu xe', error instanceof Error ? error.message : 'Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setSaving(false);
    }
  };
return { router, vehicleId, plate, setPlate, brand, setBrand, model, setModel, color, setColor, engine, setEngine, transmission, setTransmission, vehicleType, setVehicleType, photo, existingImages, deletingImageId, saving, loadingVehicle, choosePhoto, removeImage, save };
}
