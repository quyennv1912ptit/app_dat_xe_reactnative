import { rideStyles as s } from '@/components/rideStyles';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PickupNoteCard } from '../components/PickupNoteCard';
import { PHOTO_ANGLES, useVehicleInspection } from '../hooks/useVehicleInspection';
export default function VehicleInspectionScreen() {
  const h = useVehicleInspection();
  return <SafeAreaView style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}><Pressable onPress={() => h.router.back()}><Text style={s.link}>‹ Quay lại</Text></Pressable><Text style={s.title}>Biên bản {h.phase === 'pickup' ? 'nhận xe' : 'trả xe'}</Text><PickupNoteCard />
    {h.loading ? <ActivityIndicator /> : null}{h.error ? <Text style={s.error}>{h.error}</Text> : null}
    {h.existing ? <View style={s.card}><Text style={s.text}>{h.existing.confirmedByCustomer ? 'Khách đã xác nhận biên bản.' : 'Đã gửi biên bản, đang chờ khách xác nhận.'}</Text><Text style={s.text}>{h.existing.odometer} km · {h.existing.notes}</Text>{h.existing.photos.map(photo => <Image key={photo.id} source={{ uri: photo.fileUrl }} style={{ height: 180, borderRadius: 12 }} />)}</View> : h.editable ? <><View style={s.card}><Text style={s.label}>SỐ KM ĐỒNG HỒ</Text><TextInput accessibilityLabel="Số km đồng hồ" value={h.odometer} onChangeText={h.setOdometer} keyboardType="number-pad" style={s.text} placeholder="Ví dụ 12500" /><Text style={s.label}>NHIÊN LIỆU (%) · TÙY CHỌN</Text><TextInput value={h.fuelLevel} onChangeText={h.setFuelLevel} keyboardType="number-pad" style={s.text} placeholder="0–100" /><TextInput accessibilityLabel="Ghi chú biên bản" value={h.notes} onChangeText={h.setNotes} multiline maxLength={2000} style={s.text} placeholder="Tình trạng xe khi bàn giao…" /></View>
      {PHOTO_ANGLES.map(([angle, label]) => <Pressable key={angle} disabled={Boolean(h.uploading) || h.submit.isPending} onPress={() => void h.capture(angle)} style={s.card}><Text style={s.link}>{label} · Chụp ảnh</Text>{h.uploading === angle ? <ActivityIndicator /> : null}{h.photos.find(photo => photo.angle === angle) ? <Image source={{ uri: h.photos.find(photo => photo.angle === angle)!.uri }} style={{ height: 180, borderRadius: 12 }} /> : null}</Pressable>)}
      <Pressable disabled={Boolean(h.uploading) || h.submit.isPending} onPress={() => h.submit.mutate()} style={s.button}><Text style={s.buttonText}>{h.submit.isPending ? 'Đang gửi…' : 'Gửi biên bản cho khách xác nhận'}</Text></Pressable></> : <Text style={s.text}>Chỉ lập biên bản sau khi đã báo tới điểm đón hoặc điểm trả.</Text>}
  </ScrollView></SafeAreaView>;
}
