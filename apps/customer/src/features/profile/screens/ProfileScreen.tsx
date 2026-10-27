import { CustomerTabBar } from '@/components/CustomerTabBar';
import { HEADER_SAFETY_ACTION_WIDTH,HeaderLabeledIconButton,ScreenHeader } from '@/components/ScreenHeader';
import { getCustomerDisplayName,getCustomerInitials } from '@/lib/customerName';
import { signOutFirebase } from '@datxe/shared';
import type { ProfileScreenMenuItem } from '@datxe/ui';
import { Card,colors,fontSize,ProfileScreenSUPPORT_SECTION,ProfileScreenTONE_STYLES } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Alert,Image,Modal,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorMessage,styles } from '../components/ProfileScreenParts';
import { useProfile } from '../hooks/useProfile';
export default function ProfileScreen() {
const { router, profile, unreadCount, loading, loadError, refresh, logoutVisible, setLogoutVisible, deleteVisible, setDeleteVisible, deletingAccount, deleteError, setDeleteError, editVisible, setEditVisible, saving, uploadingAvatar, editError, draftName, setDraftName, draftEmail, setDraftEmail, draftDateOfBirth, setDraftDateOfBirth, draftGender, setDraftGender, draftPaymentMethod, setDraftPaymentMethod, openEdit, changeAvatar, saveProfile, confirmDeleteAccount, profileStats, serviceItems } = useProfile();
const renderMenuItem = (item: ProfileScreenMenuItem) => {
    const tone = ProfileScreenTONE_STYLES[item.tone];
    return (
      <Card
        key={item.id}
        accessibilityLabel={item.title}
        onPress={() => {
          if (item.route) router.push(item.route as never);
          else if (item.id === 'payments') openEdit();
          else if (item.id === 'help') router.push({ pathname: '/support', params: { topic: 'help' } });
          else if (item.id === 'safety') router.push({ pathname: '/support', params: { topic: 'safety' } });
        }}
        style={styles.menuRow}
      >
        <View style={styles.menuLeft}>
          <View
            style={[
              styles.menuIconBox,
              { backgroundColor: colors[tone.box as keyof typeof colors] },
            ]}
          >
            <MaterialIcons
              name={item.icon}
              size={fontSize.icon2xl}
              color={colors[tone.icon as keyof typeof colors]}
            />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.menuRight}>
          {item.badge ? (
            <View
              style={[
                styles.menuBadge,
                item.badge.highlighted && styles.menuBadgeHighlighted,
              ]}
            >
              <Text
                style={[
                  styles.menuBadgeText,
                  item.badge.highlighted && styles.menuBadgeTextHighlighted,
                ]}
              >
                {item.badge.label}
              </Text>
            </View>
          ) : null}
          <MaterialIcons
            name="chevron-right"
            size={fontSize.iconLg}
            color={colors.outline}
          />
        </View>
      </Card>
    );
  };
return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Hồ sơ"
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
        {loading && !profile ? <ActivityIndicator color={colors.primary} /> : null}
        {loadError ? (
          <Pressable onPress={() => void refresh()} style={styles.loadErrorBox}>
            <Text accessibilityRole="alert" style={styles.loadErrorText}>{loadError}</Text>
            <Text style={styles.retryText}>Chạm để thử lại</Text>
          </Pressable>
        ) : null}

        <Card style={styles.identityCard}>
          <View style={styles.identityRow}>
            <Pressable accessibilityLabel="Thay đổi ảnh đại diện" disabled={uploadingAvatar || !profile} onPress={() => void changeAvatar()} style={styles.avatarWrap}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{getCustomerInitials(profile?.full_name)}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>{uploadingAvatar ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <MaterialIcons name="photo-camera" size={fontSize.iconSm} color={colors.onPrimary} />}</View>
            </Pressable>
            <View style={styles.identityCopy}>
              <Text style={styles.userName} numberOfLines={2}>
                {getCustomerDisplayName(profile?.full_name) || 'Khách hàng'}
              </Text>
              {profile?.phone_number ? <Text style={styles.userPhone}>{profile.phone_number}</Text> : <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/add-phone-number' as never)}><Text style={styles.phoneLink}>Thêm số điện thoại</Text></Pressable>}
              <Text style={styles.userEmail} numberOfLines={1}>
                {profile?.email || 'Chưa cập nhật email'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Chỉnh sửa thông tin"
              disabled={!profile}
              onPress={openEdit}
              style={styles.editButton}
            >
              <MaterialIcons
                name="edit"
                size={fontSize.iconLg}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          <View style={styles.statsGrid}>
            {profileStats.map((stat) => (
              <View key={stat.id} style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    stat.tone === 'primary' && styles.statValuePrimary,
                    stat.tone === 'tertiary' && styles.statValueTertiary,
                  ]}
                >
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dịch vụ &amp; Xe</Text>
          {serviceItems.map(renderMenuItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hỗ trợ &amp; An toàn</Text>
          {ProfileScreenSUPPORT_SECTION.map(renderMenuItem)}
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityLabel="Đăng xuất"
            onPress={() => setLogoutVisible(true)}
            style={styles.logoutButton}
          >
            <MaterialIcons
              name="logout"
              size={fontSize.iconXl}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => { setDeleteError(''); setDeleteVisible(true); }}
            style={({ pressed }) => [styles.deleteAccountButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.deleteAccountText}>Xóa tài khoản</Text>
          </Pressable>
          <View style={styles.legalLinks}>
            <Pressable accessibilityRole="link" onPress={() => router.push('/terms-of-service' as never)}>
              <Text style={styles.legalLinkText}>Điều khoản dịch vụ</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>·</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/privacy-policy' as never)}>
              <Text style={styles.legalLinkText}>Chính sách bảo mật</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <CustomerTabBar active="profile" unreadCount={unreadCount} />

      <Modal
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
        transparent
        visible={editVisible}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.editDialogCard}>
            <Text style={styles.dialogTitle}>Chỉnh sửa thông tin</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.editLabel}>Họ và tên</Text>
              <TextInput
                autoCapitalize="words"
                maxLength={255}
                onChangeText={setDraftName}
                placeholder="Nguyễn Văn An"
                style={styles.editInput}
                value={draftName}
              />

              <Text style={styles.editLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                maxLength={255}
                onChangeText={setDraftEmail}
                placeholder="email@example.com"
                style={styles.editInput}
                value={draftEmail}
              />

              <Text style={styles.editLabel}>Ngày sinh (YYYY-MM-DD)</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setDraftDateOfBirth}
                placeholder="1995-08-20"
                style={styles.editInput}
                value={draftDateOfBirth}
              />

              <Text style={styles.editLabel}>Giới tính</Text>
              <View style={styles.editChoices}>
                {[
                  { value: 'MALE', label: 'Nam' },
                  { value: 'FEMALE', label: 'Nữ' },
                  { value: 'OTHER', label: 'Khác' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraftGender(draftGender === option.value ? '' : option.value)}
                    style={[styles.editChoice, draftGender === option.value && styles.editChoiceSelected]}
                  >
                    <Text style={[styles.editChoiceText, draftGender === option.value && styles.editChoiceTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.editLabel}>Phương thức thanh toán mặc định</Text>
              <View style={styles.editChoices}>
                {([['CASH', 'Tiền mặt']] as const).map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setDraftPaymentMethod(draftPaymentMethod === value ? null : value)}
                    style={[styles.editChoice, draftPaymentMethod === value && styles.editChoiceSelected]}
                  >
                    <Text style={[styles.editChoiceText, draftPaymentMethod === value && styles.editChoiceTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.dialogHint}>Backend hiện chỉ xử lý thanh toán tiền mặt khi đặt chuyến.</Text>

              {editError ? <Text accessibilityRole="alert" style={styles.errorText}>{editError}</Text> : null}
            </ScrollView>
            <View style={styles.dialogActions}>
              <Pressable
                disabled={saving}
                onPress={() => setEditVisible(false)}
                style={[styles.dialogButton, styles.dialogButtonGhost]}
              >
                <Text style={styles.dialogButtonGhostText}>Hủy</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={() => void saveProfile()}
                style={[styles.dialogButton, styles.dialogButtonPrimary, saving && styles.buttonDisabled]}
              >
                <Text style={styles.dialogButtonPrimaryText}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => { if (!deletingAccount) setDeleteVisible(false); }}
        transparent
        visible={deleteVisible}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.deleteDialogCard}>
            <View style={styles.dialogIcon}><MaterialIcons name="delete-outline" size={fontSize.icon2xl} color={colors.error} /></View>
            <Text style={styles.dialogTitle}>Xóa tài khoản?</Text>
            <Text style={styles.deleteDialogText}>Backend sẽ ẩn danh hồ sơ và xóa số điện thoại, ảnh đại diện, ảnh xe đã lưu. Lịch sử chuyến vẫn được giữ lại. Bạn không thể hoàn tác thao tác này.</Text>
            <Text style={styles.deleteDialogText}>Không thể xóa khi bạn còn chuyến chưa kết thúc.</Text>
            {deleteError ? <Text accessibilityRole="alert" style={styles.errorText}>{deleteError}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable disabled={deletingAccount} onPress={() => setDeleteVisible(false)} style={[styles.dialogButton, styles.dialogButtonGhost]}>
                <Text style={styles.dialogButtonGhostText}>Giữ tài khoản</Text>
              </Pressable>
              <Pressable disabled={deletingAccount} onPress={() => void confirmDeleteAccount()} style={[styles.dialogButton, styles.deleteConfirmButton, deletingAccount && styles.buttonDisabled]}>
                {deletingAccount ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.dialogButtonPrimaryText}>Xóa tài khoản</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setLogoutVisible(false)}
        transparent
        visible={logoutVisible}
      >
        <Pressable
          onPress={() => setLogoutVisible(false)}
          style={styles.dialogOverlay}
        >
          <Pressable style={styles.dialogCard}>
            <View style={styles.dialogIcon}>
              <MaterialIcons
                name="logout"
                size={fontSize.icon2xl}
                color={colors.error}
              />
            </View>
            <View style={styles.dialogCopy}>
              <Text style={styles.dialogTitle}>
                Bạn có chắc muốn đăng xuất?
              </Text>
              <Text style={styles.dialogMeta}>
                Thông tin chuyến đi và voucher đang lưu sẽ vẫn an toàn khi bạn
                đăng nhập lại.
              </Text>
            </View>
            <View style={styles.dialogActions}>
              <Pressable
                onPress={() => setLogoutVisible(false)}
                style={[styles.dialogButton, styles.dialogButtonGhost]}
              >
                <Text style={styles.dialogButtonGhostText}>Ở lại</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void signOutFirebase()
                    .then(() => {
                      setLogoutVisible(false);
                      router.replace('/(auth)/login' as never);
                    })
                    .catch((error: unknown) => Alert.alert('Không thể đăng xuất', getApiErrorMessage(error)));
                }}
                style={[styles.dialogButton, styles.dialogButtonDanger]}
              >
                <Text style={styles.dialogButtonDangerText}>Đăng xuất</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
