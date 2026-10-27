import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Image,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Choice,Field,styles } from '../components/AddVehicleScreenParts';
import { useAddVehicle } from '../hooks/useAddVehicle';
export default function AddVehicleScreen() {
const { router, vehicleId, plate, setPlate, brand, setBrand, model, setModel, color, setColor, engine, setEngine, transmission, setTransmission, vehicleType, setVehicleType, photo, existingImages, deletingImageId, saving, loadingVehicle, choosePhoto, removeImage, save } = useAddVehicle();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={vehicleId ? 'Sửa xe' : 'Thêm xe'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>{vehicleId ? 'Cập nhật thông tin phương tiện trong hồ sơ của bạn.' : 'Thông tin được lưu trực tiếp vào hồ sơ phương tiện của bạn.'}</Text>
        <Field label="Biển số xe *" value={plate} onChangeText={setPlate} placeholder="Ví dụ: 30A-123.45" autoCapitalize="characters" maxLength={20} />
        <Field label="Hãng xe" value={brand} onChangeText={setBrand} placeholder="Ví dụ: Mazda" maxLength={100} />
        <Field label="Dòng xe" value={model} onChangeText={setModel} placeholder="Ví dụ: CX-5" maxLength={100} />
        <Field label="Màu xe" value={color} onChangeText={setColor} placeholder="Ví dụ: Trắng" maxLength={50} />
      <Field label="Dung tích động cơ (cc)" value={engine} onChangeText={setEngine} placeholder="Không bắt buộc" keyboardType="numeric" maxLength={10} />
        <View style={styles.group}>
          <Text style={styles.label}>Ảnh xe (không bắt buộc)</Text>
          <Pressable onPress={() => void choosePhoto()} style={styles.photoPicker}>
            {photo ? <Image source={{ uri: photo.uri }} style={styles.photoPreview} /> : <MaterialIcons name="add-a-photo" size={25} color={colors.primary} />}
            <Text style={styles.photoText}>{photo?.fileName || 'Chọn ảnh từ thư viện để tải lên khi lưu'}</Text>
          </Pressable>
          {existingImages.map((image) => <View key={image.id} style={styles.existingImageRow}>
            <Image source={{ uri: image.secure_url }} style={styles.photoPreview} />
            <Text style={styles.photoText}>Ảnh đã lưu</Text>
            <Pressable accessibilityLabel="Xóa ảnh xe" disabled={deletingImageId !== null} onPress={() => removeImage(image.id)} style={styles.deleteImage}>
              {deletingImageId === image.id ? <ActivityIndicator color={colors.error} /> : <MaterialIcons name="delete-outline" size={22} color={colors.error} />}
            </Pressable>
          </View>)}
        </View>
        <View style={styles.group}>
          <Text style={styles.label}>Loại xe</Text>
          <View style={styles.choices}>
            <Choice label="Ô tô" active={vehicleType === 'CAR'} onPress={() => setVehicleType('CAR')} />
            <Choice label="Xe máy" active={vehicleType === 'MOTORCYCLE'} onPress={() => setVehicleType('MOTORCYCLE')} />
          </View>
        </View>
        <View style={styles.group}>
          <Text style={styles.label}>Hộp số</Text>
          <View style={styles.choices}>
            <Choice label="Số tự động" active={transmission === 'AUTO'} onPress={() => setTransmission('AUTO')} />
            <Choice label="Số sàn" active={transmission === 'MANUAL'} onPress={() => setTransmission('MANUAL')} />
          </View>
        </View>
        <Pressable disabled={saving || loadingVehicle} onPress={() => void save()} style={[styles.primary, (saving || loadingVehicle) && styles.disabled]}>
          {saving || loadingVehicle ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>{vehicleId ? 'Cập nhật phương tiện' : 'Lưu phương tiện'}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
