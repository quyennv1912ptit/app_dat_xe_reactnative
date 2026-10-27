import { Card,colors,fontSize,spacing } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Alert,
Image,
Modal,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { FILTERS,INSPECTION_LABELS,TABS,TripCard,styles } from '../components/HistoryScreenParts';
import { useHistory } from '../hooks/useHistory';
export default function DriverHistoryScreen() {
const { router, insets, filter, setFilter, inspectionOpen, setInspectionOpen, selectedTrip, visibleTrips, openInspection } = useHistory();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.liveDot} />
          <Text style={styles.headerTitle}>Lịch Sử</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/profile' as never)} style={styles.headerIcon}>
            <MaterialIcons color={colors.onPrimary} name="support-agent" size={fontSize.icon2xl} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <MaterialIcons color={colors.onPrimary} name="person-outline" size={fontSize.iconMd} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        horizontal={false}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal contentContainerStyle={styles.filterRow} showsHorizontalScrollIndicator={false}>
          {FILTERS.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
            >
              {item.icon ? (
                <MaterialIcons
                  color={filter === item.id ? colors.onPrimary : colors.onSurfaceVariant}
                  name={item.icon}
                  size={fontSize.iconSm}
                />
              ) : null}
              <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Card style={styles.performanceCard} variant="surface">
          <View style={styles.performanceTop}>
            <View style={styles.performanceTitle}>
              <View style={styles.performanceIcon}>
                <MaterialIcons color={colors.primary} name="analytics" size={fontSize.iconLg} />
              </View>
              <Text style={styles.performanceLabel}>TỔNG KẾT HIỆU SUẤT</Text>
            </View>
            <Text style={styles.goalTag}>● Đạt chỉ tiêu</Text>
          </View>
          <View style={styles.performanceBottom}>
            <View>
              <Text style={styles.totalEarnings}>3.850.000₫</Text>
              <Text style={styles.metaText}>Tổng thu nhập ròng</Text>
            </View>
            <View style={styles.tripCount}>
              <Text style={styles.tripCountValue}>18 <Text style={styles.tripCountLabel}>cuốc</Text></Text>
              <Text style={styles.safetyRate}>↗ 100% tỷ lệ an toàn</Text>
            </View>
          </View>
        </Card>

        <View style={styles.listHeading}>
          <Text style={styles.sectionHeading}>DANH SÁCH CHUYẾN ĐI</Text>
          <Text style={styles.metaText}>Cập nhật 2 phút trước</Text>
        </View>

        {visibleTrips.map((trip) => (
          <TripCard
            key={trip.id}
            onOpenInspection={() => openInspection(trip)}
            onOpenDetails={() =>
              Alert.alert(
                'Chi tiết cuốc #' + trip.id,
                trip.vehicle + '\n' + trip.date + '\n\nĐiểm đón: ' + trip.pickup + '\nĐiểm trả: ' + trip.dropoff + '\n\nThu nhập: ' + trip.earning,
              )
            }
            trip={trip}
          />
        ))}
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.spaceXs) }]}>
        {TABS.map((tab) => {
          const active = tab.label === 'Lịch sử';
          return (
            <Pressable
              accessibilityRole="button"
              key={tab.label}
              onPress={() => router.push(tab.route as never)}
              style={styles.tabItem}
            >
              <MaterialIcons color={active ? colors.primary : colors.onSurfaceVariant} name={tab.icon} size={fontSize.icon2xl} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal animationType="slide" onRequestClose={() => setInspectionOpen(false)} transparent visible={inspectionOpen}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.spaceMd }]}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalTitle}>Biên bản xe 6 góc</Text>
                <Text style={styles.modalSubtitle}>{selectedTrip.vehicle} • 30G-849.22</Text>
              </View>
              <Pressable accessibilityLabel="Đóng biên bản" onPress={() => setInspectionOpen(false)} style={styles.closeButton}>
                <MaterialIcons color={colors.onSurface} name="close" size={fontSize.iconLg} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalGrid} showsVerticalScrollIndicator={false}>
              {selectedTrip.photos?.map((uri, index) => (
                <View key={uri} style={styles.modalPhotoCard}>
                  <Image resizeMode="cover" source={{ uri }} style={styles.modalPhoto} />
                  <Text numberOfLines={1} style={styles.modalPhotoLabel}>{(index + 1) + '. ' + INSPECTION_LABELS[index]}</Text>
                </View>
              ))}
              <View style={styles.signedNotice}>
                <MaterialIcons color={colors.success} name="verified-user" size={fontSize.iconLg} />
                <View>
                  <Text style={styles.signedTitle}>Đã ký xác nhận 2 bên</Text>
                  <Text style={styles.metaText}>Không ghi nhận vết xước mới trước và sau cuốc</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
