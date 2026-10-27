import { CustomerTabBar } from '@/components/CustomerTabBar';
import { HomeMap } from '@/components/map/HomeMap';
import { HEADER_SAFETY_ACTION_WIDTH,HeaderLabeledIconButton,ScreenHeader } from '@/components/ScreenHeader';
import { Card,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
ActivityIndicator,
Image,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { describeVoucher,formatCurrency,formatDate,getGreeting,getRideStatusLabel,promoImage,styles } from '../components/HomeScreenParts';
import { useHome } from '../hooks/useHome';
export default function HomeScreen() {
const { router, profile, activeRide, recentDestinations, unreadCount, loading, loadError, currentHour, currentLocation, currentCoordinates, nearbyDrivers, locationLoading, refreshLocation, greetingName, activeVoucher, openBooking } = useHome();
return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Trang chủ"
        largeTitle
        sideSlotWidth={HEADER_SAFETY_ACTION_WIDTH}
        rightContent={<HeaderLabeledIconButton
          icon="shield"
          accessibilityLabel="An toàn chuyến đi"
          label="An toàn"
          onPress={() => router.push({ pathname: '/support', params: { topic: 'safety' } })}
        />}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.greetingCard}>
          <View style={styles.greetingCopy}>
            <Text style={styles.greetingTitle}>
              {getGreeting(currentHour)}, {greetingName}
            </Text>
            <Text style={styles.greetingMeta}>
              Sẵn sàng cho chuyến đi an toàn hôm nay.
            </Text>
          </View>
          <View style={styles.greetingLocation}>
            <View style={styles.locationBadge}>
              <MaterialIcons name="location-on" size={fontSize.iconLg} color={colors.primary} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationLabel}>ĐANG Ở</Text>
              <Text numberOfLines={1} style={styles.currentLocation}>
                {locationLoading ? 'Đang xác định vị trí…' : currentLocation}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cập nhật vị trí hiện tại"
              disabled={locationLoading}
              onPress={() => void refreshLocation(true)}
              style={styles.locationRefresh}
            >
              {locationLoading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <MaterialIcons name="my-location" size={fontSize.iconMd} color={colors.primary} />}
            </Pressable>
          </View>
        </Card>

        {loading && !profile ? <ActivityIndicator color={colors.primary} /> : null}
        {loadError ? <Text accessibilityRole="alert" style={styles.loadError}>{loadError}</Text> : null}

        <Pressable
          accessibilityLabel={activeRide ? 'Theo dõi chuyến đang hoạt động' : 'Nhập điểm đến để bắt đầu đặt xe'}
          onPress={() => openBooking()}
          style={styles.searchBar}
        >
          <MaterialIcons
            name="search"
            size={fontSize.icon2xl}
            color={colors.primary}
          />
          <Text style={styles.searchPlaceholder}>{activeRide ? 'Theo dõi chuyến đang hoạt động' : 'Chọn điểm đến'}</Text>
        </Pressable>

        <HomeMap coordinate={currentCoordinates} drivers={nearbyDrivers} />

        {!activeRide && recentDestinations.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Điểm đến gần đây</Text>
              <Text style={styles.recentHint}>Chạm để đặt lại</Text>
            </View>
            {recentDestinations.map((destination) => (
              <Pressable
                key={destination}
                accessibilityRole="button"
                accessibilityLabel={`Đặt chuyến đến ${destination}`}
                onPress={() => openBooking(destination)}
                style={styles.recentDestination}
              >
                <View style={styles.recentDestinationIcon}>
                  <MaterialIcons name="place" size={fontSize.iconMd} color={colors.primary} />
                </View>
                <Text numberOfLines={1} style={styles.recentDestinationText}>{destination}</Text>
                <MaterialIcons name="chevron-right" size={fontSize.iconLg} color={colors.onSurfaceVariant} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {activeRide ? (
          <Card
            accessibilityLabel={`Mở chi tiết chuyến ${activeRide.id}`}
            onPress={() => router.push({ pathname: '/ride/tracking', params: { rideId: String(activeRide.id) } })}
            style={styles.tripCard}
            variant="surface"
          >
            <View style={styles.tripAccent} />
            <View style={styles.tripStatusRow}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{getRideStatusLabel(activeRide.status)}</Text>
              </View>
              <Text style={styles.tripCode}>Chuyến #{activeRide.id}</Text>
            </View>

            <View style={styles.pickupBox}>
              <MaterialIcons name="trip-origin" size={fontSize.iconLg} color={colors.primary} />
              <View style={styles.pickupCopy}>
                <Text style={styles.pickupLabel}>Điểm đón</Text>
                <Text style={styles.pickupValue} numberOfLines={2}>
                  {activeRide.pickupAddress || 'Chưa có địa chỉ điểm đón'}
                </Text>
              </View>
            </View>

            <View style={styles.pickupBox}>
              <MaterialIcons name="location-on" size={fontSize.iconLg} color={colors.secondary} />
              <View style={styles.pickupCopy}>
                <Text style={styles.pickupLabel}>Điểm đến</Text>
                <Text style={styles.pickupValue} numberOfLines={2}>
                  {activeRide.dropoffAddress || 'Chưa có địa chỉ điểm đến'}
                </Text>
              </View>
            </View>

            <View style={styles.rideFareRow}>
              <Text style={styles.pickupLabel}>
                {activeRide.finalFare === null ? 'Giá dự kiến' : 'Giá cuối cùng'}
              </Text>
              <Text style={styles.rideFareValue}>
                {formatCurrency(activeRide.finalFare ?? activeRide.estimatedFare)}
              </Text>
            </View>
          </Card>
        ) : null}

        {activeVoucher ? (
          <Card
            accessibilityLabel={`Mở ưu đãi ${activeVoucher.code}`}
            gradient={[
              colors.surfaceContainerLowest,
              colors.surfaceContainerLowest,
              colors.secondaryFixed50,
            ]}
            gradientEnd={{ x: 1, y: 0.5 }}
            gradientStart={{ x: 0, y: 0.5 }}
            onPress={() => router.push('/vouchers')}
            style={styles.promoCard}
            variant="raised"
          >
            <View style={styles.promoCopy}>
              <View style={styles.promoBadge}>
                <MaterialIcons
                  name="local-offer"
                  size={fontSize.iconSm}
                  color={colors.onTertiaryFixed}
                />
                <Text style={styles.promoBadgeText}>Mã {activeVoucher.code}</Text>
              </View>
              <Text style={styles.promoTitle}>{describeVoucher(activeVoucher)}</Text>
              <Text style={styles.promoMeta}>
                Đơn tối thiểu {formatCurrency(activeVoucher.minimumOrderAmount)} · HSD {formatDate(activeVoucher.validTo)}
              </Text>
            </View>
            <Image source={promoImage} style={styles.promoImage} />
          </Card>
        ) : null}
      </ScrollView>

      <CustomerTabBar active="home" unreadCount={unreadCount} />
    </SafeAreaView>
  );
}
