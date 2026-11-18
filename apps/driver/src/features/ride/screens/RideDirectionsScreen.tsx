import { DriverDirectionsMap } from '@/components/DriverDirectionsMap';
import { DriverPage } from '@/components/DriverPage';
import { env } from '@/config/env';
import { Button, Card, Typography as Text, spacing, typography, useThemeColors } from '@datxe/ui';
import { GoongMap, MapSheetLayout, mapBounds, type GoongMapMarker } from '@datxe/ui/goong-map';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useRideDirections } from '../hooks/useRideDirections';

const fallbackCenter = { lat: 21.0285, lng: 105.8542 };
const distance = (meters: number) => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`;

export default function RideDirectionsScreen() {
  const h = useRideDirections();
  const colors = useThemeColors();
  const markers: GoongMapMarker[] = [];
  if (h.origin) markers.push({ id: 'driver', coordinate: h.origin, kind: 'driver' });
  if (h.destination) markers.push({ id: 'stop', coordinate: h.destination, kind: h.stop === 'pickup' ? 'pickup' : 'dropoff' });
  const bounds = mapBounds([...markers.map(marker => marker.coordinate), ...(h.directions?.coordinates ?? [])]);
  const title = h.stop === 'pickup' ? 'Chỉ đường đến điểm đón' : 'Chỉ đường đến điểm trả';
  if (!h.destination && h.error) {
    return (
      <DriverPage title={title}>
        <Card style={styles.card}>
          <Text accessibilityRole="alert" style={typography.bodyMd}>{h.error}</Text>
          <Button label="Thử lại" variant="secondary" onPress={h.refresh} />
          <Button label={h.fallback.label} onPress={() => h.router.replace(h.fallback.route)} />
        </Card>
      </DriverPage>
    );
  }
  return (
    <MapSheetLayout
      title={title}
      onBack={() => h.router.canGoBack() ? h.router.back() : h.router.replace('/ride/in-progress')}
      renderMap={viewport => h.destination ? (
        <DriverDirectionsMap
          destination={h.destination}
          targetLabel={h.stop === 'dropoff' ? 'điểm trả' : 'điểm đón'}
          directions={h.directions}
          viewport={viewport}
          onRefresh={h.refresh}
        />
      ) : (
        <GoongMap
          mapKey={env.goongMapKey}
          viewport={viewport}
          center={h.origin ?? h.destination ?? fallbackCenter}
          bounds={bounds}
          markers={markers}
          route={h.directions?.coordinates}
        />
      )}
      footer={(
        <>
          {h.directions ? (
            <Text style={[styles.metric, { color: colors.onSurface }]}>
              {distance(h.directions.distance)} · {Math.max(1, Math.ceil(h.directions.duration / 60))} phút
            </Text>
          ) : null}
          <Button
            variant="secondary"
            label="Cập nhật tuyến đường"
            icon="my-location"
            iconPosition="leading"
            onPress={h.refresh}
            loading={h.loading}
          />
        </>
      )}
    >
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{h.address || title}</Text>
        <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
          Chỉ xem bản đồ và thao tác khi dừng xe an toàn.
        </Text>
        {h.error ? (
          <Text accessibilityRole="alert" style={[typography.bodyMd, { color: colors.error }]}>{h.error}</Text>
        ) : h.loading && !h.directions ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
      </Card>
      {h.directions?.steps?.length ? (
        <Card style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Các bước chỉ đường</Text>
          {h.directions.steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <MaterialIcons name="navigation" size={18} color={colors.primary} importantForAccessibility="no" />
              <Text style={styles.instruction}>{index + 1}. {step.instruction}</Text>
              <Text style={[styles.stepDistance, { color: colors.onSurfaceVariant }]}>{distance(step.distanceMeters)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </MapSheetLayout>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceMd, gap: spacing.px3 },
  title: { ...typography.cardTitle },
  metric: { ...typography.screenTitle, fontVariant: ['tabular-nums'], textAlign: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.px3, paddingVertical: spacing.spaceSm },
  instruction: { ...typography.body, flex: 1 },
  stepDistance: { ...typography.label, fontVariant: ['tabular-nums'] },
});
