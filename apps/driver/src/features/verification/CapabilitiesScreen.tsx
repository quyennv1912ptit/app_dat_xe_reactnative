import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { DriverPage } from '@/components/DriverPage';
import { capabilitiesKey, getCapabilities, updateCapability, type Capability } from '@/lib/driverCapabilities';
import {
  Button,
  Card,
  GroupedList,
  MotionPressable,
  SharedStatusBadge,
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import { formatVnDate } from './verificationLabels';
import { AlertBanner } from './components/VerificationShared';

const messages: Record<string, string> = {
  WORKFLOW_DISABLED: 'Dịch vụ lái hộ chưa được bật.',
  DRIVER_UNAVAILABLE: 'Tài khoản hiện chưa thể nhận chuyến.',
  VERIFICATION_NOT_SYNCHRONIZED: 'Đang chờ đồng bộ hồ sơ. Hãy làm mới sau.',
  VERIFICATION_NOT_APPROVED: 'Hồ sơ chưa được duyệt.',
  CCCD_EXPIRED: 'Căn cước đã hết hạn. Hãy cập nhật hồ sơ.',
  CAPABILITY_NOT_APPROVED: 'Chưa đủ điều kiện hoặc phạm vi GPLX chưa bao gồm nhóm xe này.',
  CAPABILITY_EXPIRED_OR_POLICY_CHANGED: 'Quyền đã hết hiệu lực. Hãy cập nhật GPLX hoặc liên hệ hỗ trợ.',
};

const globalShortLabels: Record<string, string> = {
  WORKFLOW_DISABLED: 'Dịch vụ đang tạm tắt',
  DRIVER_UNAVAILABLE: 'Tài khoản chưa khả dụng',
  VERIFICATION_NOT_SYNCHRONIZED: 'Đang chờ đồng bộ',
  VERIFICATION_NOT_APPROVED: 'Chờ duyệt hồ sơ',
  CCCD_EXPIRED: 'CCCD đã hết hạn',
};

const globalReasonCodes = new Set(Object.keys(globalShortLabels));

export default function CapabilitiesScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const state = useQuery({ queryKey: capabilitiesKey, queryFn: getCapabilities });
  const change = useMutation({
    mutationFn: ({ groupId, enabled }: { groupId: string; enabled: boolean }) => {
      const current = state.data;
      if (!current?.approvalRevision) throw new Error('Cần làm mới trạng thái hồ sơ.');
      return updateCapability(groupId, current.approvalRevision, current.preferenceVersion, enabled);
    },
    onSuccess: data => {
      if (data) client.setQueryData(capabilitiesKey, data);
      void client.invalidateQueries({ queryKey: ['driver', 'session'] });
    },
    onError: () => { void state.refetch(); },
  });

  const groups = state.data?.groups ?? [];
  const hasAccepting = Boolean(state.data?.acceptingVehicleTypes.length);
  const globalBlockerCode =
    groups.length > 0 &&
    groups.every(
      group =>
        group.reasonCode &&
        globalReasonCodes.has(group.reasonCode) &&
        group.reasonCode === groups[0].reasonCode,
    )
      ? groups[0].reasonCode!
      : null;

  const eligibleGroups = groups.filter(group => !group.reasonCode || group.enabled);
  const ineligibleGroups = groups.filter(group => Boolean(group.reasonCode) && !group.enabled);
  const enabledEligibleCount = eligibleGroups.filter(group => group.effective).length;
  const splitGroups = eligibleGroups.length > 0 && ineligibleGroups.length > 0;

  const renderGroupRow = (group: Capability) => {
    const rowDisabled = change.isPending || state.isFetching || !state.data?.approvalRevision || (!group.enabled && Boolean(group.reasonCode));
    const statusLabel = group.reasonCode
      ? globalBlockerCode
        ? (globalShortLabels[group.reasonCode] ?? 'Chưa khả dụng')
        : (messages[group.reasonCode] ?? 'Chưa đủ điều kiện nhận chuyến.')
      : group.effective
        ? 'Đang bật nhận chuyến'
        : 'Đã duyệt · Đang tắt';
    const expiresFormatted = formatVnDate(group.expiresOn);

    return (
      <MotionPressable
        key={group.groupId}
        accessibilityRole="switch"
        accessibilityLabel={'Nhận lái hộ ' + group.label}
        accessibilityState={{ checked: group.enabled, disabled: rowDisabled }}
        disabled={rowDisabled}
        onPress={() => change.mutate({ groupId: group.groupId, enabled: !group.enabled })}
        style={[
          styles.row,
          group.effective && { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.default },
          rowDisabled && !group.enabled && styles.rowMuted,
        ]}
      >
        <View style={styles.meta}>
          <Text style={[styles.groupTitle, group.effective && { color: colors.onPrimaryContainer }]}>{group.label}</Text>
          <Text style={[styles.groupStatus, group.effective && { color: colors.onPrimaryContainer }]}>{statusLabel}</Text>
          {expiresFormatted ? (
            <Text style={[styles.expiry, group.effective && { color: colors.onPrimaryContainer }]}>
              Có hiệu lực đến {expiresFormatted}
            </Text>
          ) : null}
        </View>
        <Switch
          accessibilityLabel={'Nhận lái hộ ' + group.label}
          value={group.enabled}
          disabled={rowDisabled}
          onValueChange={enabled => change.mutate({ groupId: group.groupId, enabled })}
        />
      </MotionPressable>
    );
  };

  return (
    <DriverPage
      title="Loại xe nhận lái hộ"
      loading={state.isLoading}
      error={state.error?.message}
      retry={() => void state.refetch()}
      headerAction={(
        <Appbar.Action
          icon="refresh"
          style={styles.headerAction}
          disabled={change.isPending || state.isFetching}
          accessibilityLabel="Làm mới danh sách loại xe"
          onPress={() => void state.refetch()}
        />
      )}
    >
      <View style={styles.page}>
        {state.data?.enabled ? (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <SharedStatusBadge
                  label={
                    hasAccepting
                      ? 'Sẵn sàng nhận chuyến'
                      : eligibleGroups.length > 0
                        ? 'Chưa bật nhóm xe nào'
                        : 'Chưa có nhóm xe đủ điều kiện'
                  }
                  tone={hasAccepting ? 'success' : eligibleGroups.length > 0 ? 'pending' : 'neutral'}
                  icon={hasAccepting ? 'check-circle' : eligibleGroups.length > 0 ? 'schedule' : 'info-outline'}
                />
                {eligibleGroups.length > 0 ? (
                  <Text style={styles.counterText}>
                    {`Đã bật ${enabledEligibleCount}/${eligibleGroups.length}`}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.lead}>
                Chọn các nhóm xe bạn muốn nhận lái hộ trong phạm vi GPLX đã được duyệt. Nhóm xe mới được duyệt mặc định tắt cho đến khi bạn chủ động bật.
              </Text>
            </Card>

            {globalBlockerCode ? (
              <Card style={styles.blockerCard}>
                <AlertBanner
                  tone={globalBlockerCode === 'CCCD_EXPIRED' ? 'error' : 'warning'}
                  icon={globalBlockerCode === 'VERIFICATION_NOT_SYNCHRONIZED' ? 'sync' : 'info-outline'}
                  message={messages[globalBlockerCode] ?? 'Chưa thể thay đổi nhóm xe lúc này.'}
                />
                {globalBlockerCode === 'VERIFICATION_NOT_SYNCHRONIZED' ? (
                  <Button
                    variant="secondary"
                    label="Làm mới ngay"
                    icon="refresh"
                    iconPosition="leading"
                    loading={state.isFetching}
                    onPress={() => void state.refetch()}
                  />
                ) : globalBlockerCode === 'VERIFICATION_NOT_APPROVED' || globalBlockerCode === 'CCCD_EXPIRED' ? (
                  <Button
                    variant="secondary"
                    label="Mở hồ sơ xác minh"
                    onPress={() => router.push('/profile/verification')}
                  />
                ) : null}
              </Card>
            ) : null}

            {splitGroups ? (
              <>
                <GroupedList title="Nhóm xe đủ điều kiện">
                  {eligibleGroups.map(renderGroupRow)}
                </GroupedList>
                <GroupedList title="Nhóm xe ngoài phạm vi GPLX">
                  {ineligibleGroups.map(renderGroupRow)}
                </GroupedList>
              </>
            ) : (
              <GroupedList title="Nhóm xe đã xét duyệt">
                {groups.map(renderGroupRow)}
              </GroupedList>
            )}

            {!hasAccepting && eligibleGroups.length > 0 && !globalBlockerCode ? (
              <AlertBanner
                tone="info"
                icon="info-outline"
                message="Chưa có loại xe đã duyệt và đang bật để nhận chuyến. Hãy bật ít nhất một nhóm xe đủ điều kiện ở trên."
              />
            ) : null}
          </>
        ) : state.data ? (
          <Card><Text>Dịch vụ lái hộ chưa được bật.</Text></Card>
        ) : null}

        {change.error ? <AlertBanner tone="error" icon="error-outline" role="alert" message={change.error.message} /> : null}

        {hasAccepting ? (
          <Button label="Vào trang chủ nhận chuyến" onPress={() => router.replace('/(tabs)/home')} />
        ) : null}
        <Button variant="ghost" label="Xem hồ sơ xác minh" onPress={() => router.push('/profile/verification')} />
      </View>
    </DriverPage>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { gap: spacing.px3, paddingBottom: spacing.spaceXl },
  headerAction: { width: 48, height: 48, borderRadius: 24 },
  summaryCard: { gap: spacing.spaceSm },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.spaceSm },
  counterText: { ...typography.label, color: colors.onSurfaceVariant, fontVariant: ['tabular-nums'] },
  blockerCard: { gap: spacing.spaceSm },
  lead: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.px3, paddingVertical: spacing.px3, paddingHorizontal: spacing.spaceSm, minHeight: 56 },
  rowMuted: { opacity: 0.72 },
  meta: { flex: 1, gap: spacing.spaceXs },
  groupTitle: { ...typography.cardTitle, color: colors.onSurface },
  groupStatus: { ...typography.label, color: colors.onSurfaceVariant },
  expiry: { ...typography.caption, color: colors.onSurfaceVariant },
});
