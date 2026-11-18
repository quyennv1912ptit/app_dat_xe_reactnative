import { HeaderIconButton } from '@/components/ScreenHeader';
import { BookingMap } from '@/components/map/BookingMap';
import { MapSheetLayout } from '@datxe/ui/goong-map';
import { translate as i18nT } from '@datxe/shared';
import {
  Button,
  MotionPressable as Pressable,
  ThemedTextInput as TextInput,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';
import { formatDistanceMeters } from '../bookingUtils';
import { MapPickerPin } from '../components/MapPickerPin';
import { PlaceRow } from '../components/PlaceRow';
import { placeAccent, placeStyles } from '../components/placeStyles';
import { useMapPicker } from '../hooks/useMapPicker';

export default function MapPickerScreen() {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(placeStyles);
  const accent = placeAccent(colors);
  const h = useMapPicker();
  const pickup = h.kind === 'pickup';
  const saving = Boolean(h.saveLabel);

  return (
    <MapSheetLayout
      initialSnap={1}
      onBack={() => h.router.back()}
      topActions={(
        <HeaderIconButton
          icon="my-location"
          accessibilityLabel="Đưa bản đồ về vị trí hiện tại"
          onPress={() => { if (!h.locating) void h.recenter(); }}
        />
      )}
      renderMap={viewport => (
        <>
          <BookingMap
            center={h.center}
            cameraVersion={h.cameraVersion}
            viewport={viewport}
            editablePin
            onCenterChange={h.movePin}
            onReadyChange={h.setMapReady}
            onMovingChange={h.setMapMoving}
          />
          {h.mapReady ? <MapPickerPin moving={h.mapMoving} viewport={viewport} /> : null}
        </>
      )}
      footer={(
        <Button
          label={saving ? 'Lưu địa điểm này' : pickup ? 'Xác nhận điểm đón' : 'Xác nhận điểm đến'}
          disabled={!h.canConfirm}
          onPress={h.confirm}
          style={s.cta}
          contentColor={accent.onAction}
        />
      )}
    >
      <View style={s.sheetHeading}>
        <View style={s.sheetCopy}>
          <Text style={s.sheetTitle}>
            {i18nT(saving ? 'Lưu địa điểm' : pickup ? 'Chọn điểm đón' : 'Chọn điểm đến')}
          </Text>
          <Text style={s.sheetSubtitle}>
            {saving
              ? i18nT('Ghim vị trí cho {0}', { 0: i18nT(h.saveLabel) })
              : i18nT(pickup
                ? 'Xác nhận hoặc thay đổi điểm đón của bạn'
                : 'Xác nhận hoặc thay đổi điểm đến của bạn')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18nT('Đổi địa chỉ bằng tên')}
          onPress={() => h.router.back()}
          style={s.sheetEdit}
        >
          <MaterialIcons name="edit" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      {h.error ? (
        <View style={s.errorBox}>
          <Text accessibilityRole="alert" style={s.errorText}>{i18nT(h.error)}</Text>
        </View>
      ) : null}
      {h.retryable ? <Button variant="secondary" label="Thử lại" onPress={h.retry} /> : null}

      {h.place ? (
        <PlaceRow
          selected
          title={h.place.name}
          address={h.place.address}
          icon={pickup ? 'person-pin-circle' : 'place'}
          iconColor={pickup ? accent.onAccent : colors.onRideDropoff}
          iconBackground={pickup ? accent.pickup : accent.dropoff}
        />
      ) : (
        <View style={s.statusRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.statusText}>
            {i18nT(h.resolving ? 'Đang lấy vị trí…' : 'Chưa chọn địa điểm')}
          </Text>
        </View>
      )}

      <View style={s.nearbyHeader}>
        <Text style={s.nearbyTitle}>{i18nT('Các điểm gần đây')}</Text>
        <Text style={s.listMeta}>
          {h.nearbyWithinRadius ? `≤ ${h.nearbyRadius} m` : i18nT('Các điểm gần nhất')}
        </Text>
      </View>

      {h.nearbyLoading ? (
        <View style={s.statusRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.statusText}>{i18nT('Đang tìm điểm gần đây…')}</Text>
        </View>
      ) : null}
      {!h.nearbyLoading && !h.nearbyPlaces.length ? (
        h.nearbyError ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{i18nT('Không tải được điểm gần đây.')}</Text>
            <Button variant="secondary" label="Thử lại" onPress={() => void h.retryNearby()} />
          </View>
        ) : (
          <Text style={s.helperPadded}>
            {i18nT('Không có địa điểm nào trong 100 m. Bạn vẫn có thể xác nhận vị trí ghim.')}
          </Text>
        )
      ) : null}
      {h.nearbyPlaces.map((place) => (
        <PlaceRow
          key={place.id}
          title={place.name}
          address={place.address}
          meta={formatDistanceMeters(place.distanceMeters)}
          icon="place"
          onPress={() => h.selectNearby(place)}
        />
      ))}

      {pickup ? (
        <View style={s.noteBox}>
          <MaterialIcons name="chat-bubble-outline" size={20} color={colors.primary} />
          <TextInput
            value={h.note}
            onChangeText={h.setNote}
            accessibilityLabel={i18nT('Thêm ghi chú cho bác tài')}
            placeholder={i18nT('Thêm ghi chú cho bác tài')}
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            maxLength={500}
            style={s.noteInput}
          />
        </View>
      ) : null}
    </MapSheetLayout>
  );
}
