import { colors,fontSize,spacing } from '@datxe/ui';
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
import { DRIVER_PORTRAIT,MetricCard,SettingRow,styles,TABS } from '../components/ProfileScreenParts';
import { useProfile } from '../hooks/useProfile';
export default function DriverProfileScreen() {
const { router, insets, autoAccept, setAutoAccept, withdrawing, withdraw, callHotline, confirmLogout } = useProfile();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.liveDot} />
          <Text style={styles.headerTitle}>Hồ Sơ</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => void callHotline()} style={styles.headerIcon}>
            <MaterialIcons color={colors.onPrimary} name="support-agent" size={fontSize.icon2xl} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <MaterialIcons color={colors.onPrimary} name="person-outline" size={fontSize.iconMd} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.portraitWrap}>
              <Image accessibilityLabel="Ảnh đại diện tài xế Nguyễn Văn Tuấn" resizeMode="cover" source={{ uri: DRIVER_PORTRAIT }} style={styles.portrait} />
              <View style={styles.verifiedBadge}>
                <MaterialIcons color={colors.onSuccessContainer} name="verified" size={fontSize.iconSm} />
              </View>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.driverName}>Nguyễn Văn Tuấn</Text>
              <View style={styles.tierBadge}>
                <MaterialIcons color={colors.primary} name="diamond" size={fontSize.iconSm} />
                <Text style={styles.tierText}>TÀI XẾ HẠNG KIM CƯƠNG</Text>
              </View>
              <View style={styles.proofRow}>
                <Text style={styles.proofBadge}><Text style={styles.star}>★</Text> 4.98 <Text style={styles.proofSub}>(1.420 chuyến)</Text></Text>
              </View>
              <View style={styles.proofRow}>
                <Text style={styles.proofBadge}><Text style={styles.greenDotText}>●</Text> Bằng B2 • Đã kích hoạt</Text>
              </View>
            </View>
          </View>
          <View style={styles.safetyBanner}>
            <View style={styles.safetyIcon}>
              <MaterialIcons color={colors.successStrong} name="verified-user" size={fontSize.iconMd} />
            </View>
            <View style={styles.safetyCopy}>
              <Text style={styles.safetyTitle}>Tiêu chuẩn an toàn 5 sao</Text>
              <Text style={styles.safetySub}>Đạt chứng chỉ lái xe an toàn đêm</Text>
            </View>
            <MaterialIcons color={colors.outline} name="verified-user" size={fontSize.iconLg} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hiệu suất 30 ngày qua</Text>
          <Pressable onPress={() => Alert.alert('Hiệu suất tài xế', 'Bạn đang nằm trong nhóm 1% tài xế có đánh giá cao nhất.')} accessibilityRole="button">
            <Text style={styles.detailLink}>Chi tiết điểm</Text>
          </Pressable>
        </View>
        <View style={styles.metricsRow}>
          <MetricCard icon="call-received" label="Nhận cuốc" value="98%" status="↑ Tuyệt vời" tint={colors.primary} progress={0.98} />
          <MetricCard icon="task-alt" label="Hoàn thành" value="100%" status="✓ Tối ưu" tint={colors.success} progress={1} />
          <MetricCard icon="star" label="Đánh giá" value="4.98/5" status="♜ Top 1%" tint="#F59E0B" progress={0.996} />
        </View>

        <View style={styles.walletBanner}>
          <View style={styles.walletCopy}>
            <View style={styles.walletLabelRow}>
              <MaterialIcons color={colors.primaryFixed} name="account-balance-wallet" size={fontSize.iconMd} />
              <Text style={styles.walletLabel}>Số dư ví khả dụng</Text>
            </View>
            <Text style={styles.walletAmount}>4.250.000₫</Text>
            <Text style={styles.walletSub}>Sẵn sàng rút về tài khoản liên kết</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={withdraw} style={styles.withdrawButton}>
            <Text style={styles.withdrawText}>{withdrawing ? 'Đang xử lý' : 'Rút tiền'}</Text>
            <MaterialIcons color={colors.primary} name={withdrawing ? 'refresh' : 'arrow-forward'} size={fontSize.iconSm} />
          </Pressable>
        </View>

        <Text style={styles.settingsHeading}>Cài đặt & Pháp lý tài xế</Text>
        <View style={styles.settingsCard}>
          <SettingRow icon="badge" title="Giấy phép lái xe & Hồ sơ pháp lý" detail="✓ Đã duyệt CSGT" detailTone="success" onPress={() => router.push('/(auth)/license-upload' as never)} />
          <SettingRow icon="payments" title="Ví tài xế & Ngân hàng nhận tiền" detail="Vietcombank •••• 8829 (Miễn phí rút 24/7)" />
          <SettingRow icon="security" title="Bảo hiểm trách nhiệm lái xe hộ" detail="Bảo hiểm PTI gói 500 triệu • Hiệu lực" />
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, styles.autoIcon]}>
              <MaterialIcons color={colors.primary} name="near-me" size={fontSize.iconLg} />
            </View>
            <View style={styles.settingCopy}>
              <Text numberOfLines={1} style={styles.settingTitle}>Tự động nhận cuốc & Bán kính</Text>
              <Text numberOfLines={1} style={styles.settingDetail}>{autoAccept ? 'Đang bật' : 'Đang tắt'} • Bán kính nhận tối đa 5.0 km</Text>
            </View>
            <Pressable
              accessibilityLabel={autoAccept ? 'Tắt tự động nhận cuốc' : 'Bật tự động nhận cuốc'}
              accessibilityRole="switch"
              accessibilityState={{ checked: autoAccept }}
              onPress={() => setAutoAccept((enabled) => !enabled)}
              style={[styles.toggleTrack, autoAccept && styles.toggleTrackActive]}
            >
              <View style={[styles.toggleThumb, autoAccept && styles.toggleThumbActive]} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => void callHotline()} style={styles.settingRow}>
            <View style={[styles.settingIcon, styles.emergencyIcon]}>
              <MaterialIcons color={colors.error} name="fmd-bad" size={fontSize.iconLg} />
            </View>
            <View style={styles.settingCopy}>
              <Text numberOfLines={1} style={[styles.settingTitle, styles.emergencyText]}>Trung tâm hỗ trợ khẩn cấp 24/7</Text>
              <Text style={styles.settingDetail}>Hotline SOS trực ban: 1900 8888</Text>
            </View>
            <MaterialIcons color={colors.error} name="phone-in-talk" size={fontSize.iconLg} />
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={confirmLogout} style={styles.logoutButton}>
          <MaterialIcons color={colors.error} name="logout" size={fontSize.iconLg} />
          <Text style={styles.logoutText}>Đăng xuất tài xế</Text>
        </Pressable>
        <Text style={styles.versionText}>Phiên bản ứng dụng v3.8.4 (Bản chuẩn tài xế đêm)</Text>
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.spaceXs) }]}>
        {TABS.map((tab) => {
          const active = tab.label === 'Hồ sơ';
          return (
            <Pressable accessibilityRole="button" key={tab.label} onPress={() => router.push(tab.route as never)} style={styles.tabItem}>
              <MaterialIcons color={active ? colors.primary : colors.onSurfaceVariant} name={tab.icon} size={fontSize.icon2xl} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
