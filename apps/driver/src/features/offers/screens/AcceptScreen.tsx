import { Button,Card,colors,fontSize,spacing } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Image,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { CountdownTimer,INITIAL_COUNTDOWN,MAP_IMAGE,RouteStop,TripInfo,styles } from '../components/AcceptScreenParts';
import { useAccept } from '../hooks/useAccept';
export default function AcceptRideScreen() {
const { router, insets, secondsLeft, dispatchState, acceptRide, declineRide, acceptLabel, statusMessage } = useAccept();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              color={colors.onPrimary}
              name="arrow-back"
              size={fontSize.icon2xl}
            />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>
            Chuyến Xe Hiện Tại
          </Text>
          <View style={styles.profileIcon}>
            <MaterialIcons
              color={colors.onPrimary}
              name="person-outline"
              size={fontSize.iconMd}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.spaceMd) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapSection}>
          <Image
            accessible={false}
            resizeMode="cover"
            source={{ uri: MAP_IMAGE }}
            style={styles.mapImage}
          />
          <View pointerEvents="none" style={styles.mapWash} />
          <View pointerEvents="none" style={styles.mapLowerWash} />

          <View style={styles.mapBadges}>
            <View style={styles.radarBadge}>
              <View style={styles.radarDot} />
              <Text numberOfLines={1} style={styles.radarBadgeText}>
                Đang quét định vị chính xác
              </Text>
            </View>
            <View style={styles.vipBadge}>
              <MaterialIcons
                color={colors.tertiaryFixed}
                name="verified"
                size={fontSize.iconSm}
              />
              <Text style={styles.vipBadgeText}>Khách VIP</Text>
            </View>
          </View>

          <Card style={styles.vehicleCard} variant="surface">
            <View style={styles.vehicleIconBox}>
              <MaterialIcons
                color={colors.primary}
                name="directions-car"
                size={fontSize.icon2xl}
              />
            </View>
            <View style={styles.vehicleCopy}>
              <Text numberOfLines={1} style={styles.vehicleName}>
                Mazda CX-5 (AT)
              </Text>
              <Text numberOfLines={1} style={styles.vehicleDescription}>
                Trợ lực điện • Phanh tay điện tử
              </Text>
            </View>
            <View style={styles.transmissionBadge}>
              <Text style={styles.transmissionText}>Số tự động</Text>
            </View>
          </Card>
        </View>

        <View style={styles.dispatchContent}>
          <Card style={styles.dispatchCard} variant="raised">
            <View style={styles.accentBar}>
              <View style={[styles.accentSegment, { backgroundColor: colors.primary }]} />
              <View style={[styles.accentSegment, { backgroundColor: colors.success }]} />
              <View
                style={[styles.accentSegment, { backgroundColor: colors.primaryContainer }]}
              />
            </View>

            <View style={styles.dispatchSummary}>
              <View style={styles.earningCopy}>
                <Text style={styles.earningLabel}>THU NHẬP THỰC NHẬN</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amount}>210.000</Text>
                  <Text style={styles.currency}>₫</Text>
                </View>
                <View style={styles.insuranceNote}>
                  <MaterialIcons
                    color={colors.success}
                    name="receipt-long"
                    size={fontSize.iconSm}
                  />
                  <Text numberOfLines={1} style={styles.insuranceText}>
                    Đã cộng bảo hiểm chuyến
                  </Text>
                </View>
              </View>
              <CountdownTimer
                seconds={secondsLeft}
                totalSeconds={INITIAL_COUNTDOWN}
              />
            </View>

            <View style={styles.routeCard}>
              <RouteStop
                icon="radio-button-checked"
                iconColor={colors.success}
                badge="ĐÓN KHÁCH"
                badgeColor={colors.success}
                distance="1.2 km • ~4 phút"
                title="Quán bia Thu Hằng"
                address="45 Quán Thánh, P. Quán Thánh, Ba Đình"
                withConnector
              />
              <RouteStop
                icon="location-on"
                iconColor={colors.error}
                badge="TRẢ VỀ"
                badgeColor={colors.error}
                distance="8.5 km • Lộ trình an toàn"
                title="Tòa Park 8, Vinhomes Times City"
                address="458 Minh Khai, P. Vĩnh Tuy, Hai Bà Trưng"
              />
            </View>

            <View style={styles.tripInfoRow}>
              <TripInfo
                icon="local-drink"
                label="Trạng thái khách"
                value="Có dùng cồn nhẹ"
              />
              <TripInfo
                icon="payments"
                label="Thanh toán"
                value="Ví Doanh Nghiệp"
              />
            </View>

            {statusMessage ? (
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.statusMessage,
                  dispatchState === 'accepted' && styles.statusAccepted,
                  dispatchState === 'declined' && styles.statusDeclined,
                  dispatchState === 'expired' && styles.statusExpired,
                ]}
              >
                <Text style={styles.statusMessageText}>{statusMessage}</Text>
              </View>
            ) : null}

            <View style={styles.actionButtons}>
              <Button
                accessibilityLabel={acceptLabel}
                disabled={dispatchState === 'expired' || dispatchState === 'declined'}
                icon={dispatchState === 'expired' ? 'hourglass-disabled' : 'task-alt'}
                iconPosition="leading"
                iconSize={fontSize.icon2xl}
                label={acceptLabel}
                loading={dispatchState === 'accepted'}
                loadingLabel="Đang điều hướng điểm đón..."
                onPress={acceptRide}
                style={styles.acceptButton}
                textStyle={styles.acceptButtonText}
              />
              <Button
                accessibilityLabel="Từ chối chuyến xe"
                contentColor={colors.error}
                disabled={dispatchState === 'accepted' || dispatchState === 'declined'}
                icon={dispatchState === 'declined' ? 'block' : 'close'}
                iconPosition="leading"
                iconSize={fontSize.iconXl}
                label={dispatchState === 'declined' ? 'Đã từ chối' : 'Từ chối (Bỏ qua)'}
                onPress={declineRide}
                style={styles.declineButton}
                textStyle={styles.declineButtonText}
              />
            </View>
          </Card>

          <View style={styles.safetyFooter}>
            <MaterialIcons
              color={colors.outline}
              name="verified-user"
              size={fontSize.iconMd}
            />
            <Text style={styles.safetyFooterText}>
              Dịch vụ lái xe hộ an toàn ban đêm • Tuân thủ Luật ATGT
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
