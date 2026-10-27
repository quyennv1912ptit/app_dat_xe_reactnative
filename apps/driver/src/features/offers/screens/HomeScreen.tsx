import { Button,Card,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Alert,
Image,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { DRIVER_PORTRAIT,HOME_TABS,MapControl,MetricTile,SwitchControl,styles } from '../components/HomeScreenParts';
import { useHome } from '../hooks/useHome';
export default function DriverHomeScreen() {
const { router, insets, isOnline, setIsOnline, autoAccept, setAutoAccept, heatMapEnabled, setHeatMapEnabled, isLocating, locationLabel, priorityRegion, callSupport, locateDriver, choosePriorityRegion, navigateToTab } = useHome();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerLiveDot} />
            <Text style={styles.headerTitle}>Trang Chủ</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Gọi tổng đài hỗ trợ 1900 6868"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void callSupport()}
              style={styles.headerIconButton}
            >
              <MaterialIcons
                color={colors.onPrimary}
                name="support-agent"
                size={fontSize.icon2xl}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Mở hồ sơ tài xế"
              accessibilityRole="button"
              onPress={() => navigateToTab('profile')}
              style={styles.headerProfileIcon}
            >
              <MaterialIcons
                color={colors.onPrimary}
                name="person-outline"
                size={fontSize.iconMd}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.driverCard} variant="surface">
          <View style={styles.driverIdentity}>
            <View style={styles.portraitWrap}>
              <Image
                accessibilityLabel="Ảnh đại diện tài xế Nguyễn Văn Tuấn"
                resizeMode="cover"
                source={{ uri: DRIVER_PORTRAIT }}
                style={styles.driverPortrait}
              />
              <View style={styles.portraitStatusDot} />
            </View>
            <View style={styles.driverCopy}>
              <View style={styles.driverNameRow}>
                <Text numberOfLines={1} style={styles.driverName}>
                  Nguyễn Văn Tuấn
                </Text>
                <View style={styles.ratingBadge}>
                  <MaterialIcons
                    color={colors.starYellow}
                    name="star"
                    size={fontSize.iconSm}
                  />
                  <Text style={styles.ratingText}>4.98</Text>
                </View>
              </View>
              <View style={styles.driverMetaRow}>
                <MaterialIcons
                  color={colors.primary}
                  name="directions-car"
                  size={fontSize.iconSm}
                />
                <Text numberOfLines={1} style={styles.driverMeta}>
                  Tài xế Hạng Kim Cương
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Thông báo mới"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => navigateToTab('notifications')}
            style={styles.notificationButton}
          >
            <MaterialIcons
              color={colors.onSurfaceVariant}
              name="notifications-none"
              size={fontSize.iconXl}
            />
            <View style={styles.notificationDot} />
          </Pressable>
        </Card>

        <Card style={styles.availabilityCard} variant="surface">
          <View style={styles.availabilityTopRow}>
            <View
              style={[
                styles.radarIcon,
                isOnline ? styles.radarIconOnline : styles.radarIconOffline,
              ]}
            >
              <MaterialIcons
                color={isOnline ? colors.success : colors.secondary}
                name={isOnline ? 'radar' : 'pause-circle-outline'}
                size={fontSize.icon2xl}
              />
            </View>
            <View style={styles.availabilityCopy}>
              <View style={styles.statusHeading}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? colors.success : colors.secondary },
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.statusTitle,
                    { color: isOnline ? colors.success : colors.secondary },
                  ]}
                >
                  {isOnline ? 'Đang Sẵn Sàng Nhận Cuốc' : 'Đang Tạm Nghỉ (Offline)'}
                </Text>
              </View>
              <Text numberOfLines={2} style={styles.statusSubtitle}>
                {isOnline
                  ? 'Hệ thống đang ghép cặp khách hàng gần bạn'
                  : 'Bật công tắc để bắt đầu nhận cuốc mới'}
              </Text>
            </View>
            <SwitchControl
              accessibilityLabel="Trạng thái sẵn sàng nhận cuốc"
              value={isOnline}
              onValueChange={setIsOnline}
              onlineColor={colors.success}
            />
          </View>
          <View style={styles.queueInfoRow}>
            <View style={styles.queueRange}>
              <MaterialIcons
                color={colors.success}
                name="near-me"
                size={fontSize.iconSm}
              />
              <Text style={styles.queueText}>
                Phạm vi quét: <Text style={styles.queueStrong}>3.5 km</Text>
              </Text>
            </View>
            <View style={styles.demandIndicator}>
              <View style={styles.demandDot} />
              <Text style={styles.demandText}>Nhu cầu tăng cao (+25%)</Text>
            </View>
          </View>
        </Card>

        <Button
          icon="bolt"
          iconPosition="leading"
          label="Mô phỏng cuốc xe mới"
          onPress={() => router.push('/ride/accept' as never)}
          style={styles.demoRideButton}
          textStyle={styles.demoRideButtonText}
        />

        <Card accessibilityLabel="Bản đồ nhu cầu tại Hà Nội" style={styles.mapCard} variant="muted">
          <View style={styles.mapCanvas}>
            <View style={styles.mapTint} />
            <View style={styles.mapRoadHorizontal} />
            <View style={styles.mapRoadDiagonal} />
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapPark} />

            {heatMapEnabled ? (
              <>
                <View style={[styles.demandPill, styles.hoanKiemPill]}>
                  <View style={[styles.demandPillDot, styles.hotDot]} />
                  <Text numberOfLines={1} style={styles.demandPillText}>
                    Hoàn Kiếm: Nóng x1.4
                  </Text>
                </View>
                <View style={[styles.demandPill, styles.cauGiayPill]}>
                  <View style={[styles.demandPillDot, styles.warmDot]} />
                  <Text numberOfLines={1} style={styles.demandPillText}>
                    Cầu Giấy: 18 cuốc chờ
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.mapModePill}>
                <Text style={styles.mapModeText}>Đã tắt lớp nhu cầu</Text>
              </View>
            )}

            <View pointerEvents="none" style={styles.driverPin}>
              <View style={styles.pinHalo} />
              <View style={styles.pinCore}>
                <MaterialIcons
                  color={colors.onPrimary}
                  name="local-taxi"
                  size={fontSize.iconMd}
                />
              </View>
              <View style={styles.pinLabel}>
                <Text style={styles.pinLabelText}>Vị trí của bạn</Text>
              </View>
            </View>

            <View style={styles.mapControls}>
              <MapControl
                accessibilityLabel="Định vị hiện tại"
                icon={isLocating ? 'gps-not-fixed' : 'my-location'}
                onPress={() => void locateDriver()}
                tint={colors.primary}
              />
              <MapControl
                accessibilityLabel={heatMapEnabled ? 'Tắt lớp nhu cầu' : 'Bật lớp nhu cầu'}
                icon="local-fire-department"
                onPress={() => setHeatMapEnabled((enabled) => !enabled)}
                tint={heatMapEnabled ? colors.error : colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.locationBar}>
              <MaterialIcons
                color={colors.primary}
                name="navigation"
                size={fontSize.iconMd}
              />
              <Text numberOfLines={1} style={styles.locationText}>
                Đang ở: <Text style={styles.locationStrong}>{locationLabel}</Text>
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.earningsCard} variant="surface">
          <View style={styles.earningsHeading}>
            <View style={styles.sectionTitleGroup}>
              <MaterialIcons
                color={colors.primary}
                name="payments"
                size={fontSize.iconXl}
              />
              <Text style={styles.sectionTitle}>Thu nhập hôm nay</Text>
            </View>
            <Pressable
              accessibilityLabel="Xem chi tiết ví"
              accessibilityRole="button"
              onPress={() =>
                Alert.alert('Ví tài xế', 'Chi tiết ví sẽ hiển thị khi tính năng ví được kết nối.')
              }
              style={styles.walletButton}
            >
              <Text style={styles.walletButtonText}>Chi tiết ví</Text>
              <MaterialIcons
                color={colors.primary}
                name="chevron-right"
                size={fontSize.iconMd}
              />
            </Pressable>
          </View>

          <View style={styles.totalEarningsPanel}>
            <View style={styles.totalEarningsCopy}>
              <Text style={styles.earningsCaption}>Tổng thu nhập ròng</Text>
              <View style={styles.totalAmountRow}>
                <Text style={styles.totalAmount}>1.450.000</Text>
                <Text style={styles.currency}>₫</Text>
              </View>
            </View>
            <View style={styles.comparisonCopy}>
              <View style={styles.growthBadge}>
                <MaterialIcons
                  color={colors.success}
                  name="trending-up"
                  size={fontSize.iconSm}
                />
                <Text style={styles.growthText}>+18%</Text>
              </View>
              <Text style={styles.comparisonCaption}>so với hôm qua</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <MetricTile icon="route" label="Số chuyến" value="6 chuyến" />
            <MetricTile icon="schedule" label="Thời gian online" value="4h 15m" />
          </View>
        </Card>

        <Card style={styles.settingCard} variant="surface">
          <View style={styles.settingIconBox}>
            <MaterialIcons
              color={colors.primary}
              name="bolt"
              size={fontSize.iconXl}
            />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Bật nhận cuốc tự động</Text>
            <Text numberOfLines={2} style={styles.settingSubtitle}>
              Tự động chốt khi cuốc phù hợp tiêu chí
            </Text>
          </View>
          <SwitchControl
            accessibilityLabel="Nhận cuốc tự động"
            value={autoAccept}
            onValueChange={setAutoAccept}
            onlineColor={colors.primary}
            compact
          />
        </Card>

        <Pressable
          accessibilityLabel="Chọn khu vực hoạt động ưu tiên"
          accessibilityRole="button"
          onPress={choosePriorityRegion}
        >
          <Card style={styles.settingCard} variant="surface">
            <View style={styles.zoneIconBox}>
              <MaterialIcons
                color={colors.success}
                name="pin-drop"
                size={fontSize.iconXl}
              />
            </View>
            <View style={styles.settingCopy}>
              <View style={styles.zoneTitleRow}>
                <Text numberOfLines={1} style={styles.settingTitle}>
                  Khu vực hoạt động ưu tiên
                </Text>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Đang chọn</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.settingSubtitle}>
                {priorityRegion}
              </Text>
            </View>
            <MaterialIcons
              color={colors.onSurfaceVariant}
              name="tune"
              size={fontSize.iconXl}
            />
          </Card>
        </Pressable>

        <Card style={styles.safetyCard} variant="muted">
          <View style={styles.safetyMessage}>
            <MaterialIcons
              color={colors.primary}
              name="shield"
              size={fontSize.iconXl}
            />
            <Text numberOfLines={2} style={styles.safetyText}>
              Gói bảo hiểm trách nhiệm dân sự cá nhân đang{' '}
              <Text style={styles.safetyStrong}>kích hoạt</Text>
            </Text>
          </View>
          <Button
            label="SOS 24/7"
            onPress={() => void callSupport()}
            style={styles.sosButton}
            textStyle={styles.sosButtonText}
          />
        </Card>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {HOME_TABS.map((tab) => {
          const selected = tab.id === 'home';
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => navigateToTab(tab.id)}
              style={styles.navItem}
            >
              <MaterialIcons
                color={selected ? colors.primary : colors.onSurfaceVariant}
                name={tab.icon}
                size={fontSize.icon2xl}
              />
              <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
