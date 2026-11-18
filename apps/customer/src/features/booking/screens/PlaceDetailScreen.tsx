import { ScreenHeader } from '@/components/ScreenHeader';
import { BookingMap } from '@/components/map/BookingMap';
import { translate as i18nT } from '@datxe/shared';
import {
  Button,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';
import { placeAccent, placeStyles } from '../components/placeStyles';
import { ReportPlaceSheet } from '../components/ReportPlaceSheet';
import { SavePlaceSheet } from '../components/SavePlaceSheet';
import { usePlaceDetail } from '../hooks/usePlaceDetail';

export default function PlaceDetailScreen() {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(placeStyles);
  const accent = placeAccent(colors);
  const h = usePlaceDetail();
  const [saveVisible, setSaveVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [snack, setSnack] = useState('');
  const pickup = h.kind === 'pickup';

  const submitReport = async (reason: string) => {
    try {
      await h.report(reason);
      setReportVisible(false);
      setSnack(i18nT('Đã gửi báo lỗi địa chỉ'));
    } catch {
      // Lỗi hiển thị trong sheet để người dùng thử lại.
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={i18nT('Chi tiết địa điểm')} onBack={() => h.router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.detailMap}>
          {h.place ? (
            <BookingMap
              center={h.place.coordinate ?? DEFAULT_MAP_CENTER}
              pickup={pickup ? { coordinate: h.place.coordinate } : null}
              dropoff={pickup ? null : { coordinate: h.place.coordinate }}
              interactive={false}
            />
          ) : (
            <View style={s.detailMapPlaceholder}>
              {h.loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <MaterialIcons name="map" size={40} color={colors.outline} />
              )}
            </View>
          )}
        </View>

        {h.error ? (
          <View style={s.errorBox}>
            <Text accessibilityRole="alert" style={s.errorText}>{i18nT(h.error)}</Text>
            <Button variant="secondary" label="Thử lại" onPress={() => void h.retry()} />
          </View>
        ) : null}

        {h.place ? (
          <>
            <Text style={s.detailTitle}>{h.place.name || h.titleOf(h.place.address)}</Text>
            {h.distance ? (
              <View style={s.detailMeta}>
                <MaterialIcons name="call-made" size={18} color={colors.onSurfaceVariant} />
                <Text style={s.detailMetaText}>{h.distance}</Text>
              </View>
            ) : null}
            <View style={s.detailMeta}>
              <MaterialIcons name="place" size={18} color={colors.onSurfaceVariant} />
              <Text style={[s.detailMetaText, s.flex]}>{h.place.address}</Text>
            </View>

            <View style={s.detailActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT('Lưu địa điểm')}
                onPress={() => setSaveVisible(true)}
                style={({ pressed }) => [s.actionCard, pressed && s.pressed]}
              >
                <MaterialIcons
                  name={h.saved ? 'bookmark' : 'bookmark-border'}
                  size={26}
                  color={colors.primary}
                />
                <Text style={s.actionLabel}>{i18nT('Lưu địa điểm')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT('Sao chép địa điểm')}
                onPress={() => void h.copy()}
                style={({ pressed }) => [s.actionCard, pressed && s.pressed]}
              >
                <MaterialIcons name="content-copy" size={24} color={colors.primary} />
                <Text style={s.actionLabel}>{i18nT('Sao chép địa điểm')}</Text>
              </Pressable>
            </View>

            <View style={s.divider} />
            <Text style={s.feedbackTitle}>{i18nT('Phản hồi về địa chỉ')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT('Báo lỗi địa chỉ')}
              onPress={() => setReportVisible(true)}
              style={({ pressed }) => [s.feedbackCard, pressed && s.pressed]}
            >
              <MaterialIcons name="flag" size={22} color={colors.onSurfaceVariant} />
              <View style={s.feedbackCopy}>
                <Text style={s.feedbackTitleText}>{i18nT('Báo lỗi địa chỉ')}</Text>
                <Text style={s.listAddress}>{i18nT('Tên địa chỉ sai, đã đóng cửa...')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <Button
          label="Chọn địa điểm này"
          disabled={!h.place}
          onPress={h.choose}
          style={s.cta}
          contentColor={accent.onAction}
        />
      </View>

      <SavePlaceSheet
        visible={saveVisible}
        address={h.place?.address ?? ''}
        onClose={() => setSaveVisible(false)}
        onSave={(label) => {
          h.save(label);
          setSaveVisible(false);
        }}
      />
      <ReportPlaceSheet
        key={reportVisible ? 'report-open' : 'report-closed'}
        visible={reportVisible}
        address={h.place?.address ?? ''}
        submitting={h.reporting}
        error={h.reportError}
        onClose={() => {
          setReportVisible(false);
          h.resetReport();
        }}
        onSubmit={submitReport}
      />
      <Snackbar
        visible={Boolean(h.toast || snack)}
        onDismiss={() => {
          h.clearToast();
          setSnack('');
        }}
        duration={2200}
      >
        {h.toast || snack}
      </Snackbar>
    </SafeAreaView>
  );
}
