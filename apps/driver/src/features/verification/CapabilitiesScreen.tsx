import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Appbar, Divider } from 'react-native-paper';
import { DriverPage } from '@/components/DriverPage';
import { capabilitiesKey, getCapabilities, updateCapability } from '@/lib/driverCapabilities';
import { Button, Card, GroupedList, Typography as Text, borderRadius, spacing, typography, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';

const messages: Record<string, string> = {
  WORKFLOW_DISABLED: 'Dịch vụ lái hộ chưa được bật.',
  DRIVER_UNAVAILABLE: 'Tài khoản hiện chưa thể nhận chuyến.',
  VERIFICATION_NOT_SYNCHRONIZED: 'Đang chờ đồng bộ hồ sơ. Hãy làm mới sau.',
  VERIFICATION_NOT_APPROVED: 'Hồ sơ chưa được duyệt.',
  CCCD_EXPIRED: 'Căn cước đã hết hạn. Hãy cập nhật hồ sơ.',
  CAPABILITY_NOT_APPROVED: 'Chưa đủ điều kiện hoặc phạm vi GPLX chưa bao gồm nhóm xe này.',
  CAPABILITY_EXPIRED_OR_POLICY_CHANGED: 'Quyền đã hết hiệu lực. Hãy cập nhật GPLX hoặc liên hệ hỗ trợ.',
};

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

  const hasAccepting = Boolean(state.data?.acceptingVehicleTypes.length);

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
            <Card>
              <Text style={styles.lead}>
                Chọn các nhóm xe bạn muốn nhận lái hộ trong phạm vi GPLX đã được duyệt. Nhóm xe mới được duyệt mặc định tắt cho đến khi bạn chủ động bật.
              </Text>
            </Card>
            <GroupedList title="Nhóm xe đã xét duyệt">
              {state.data.groups.map((group, index) => {
                const statusLabel = group.reasonCode
                  ? (messages[group.reasonCode] ?? 'Chưa đủ điều kiện nhận chuyến.')
                  : group.effective ? 'Đang bật nhận chuyến' : 'Đã duyệt · Đang tắt';
                return (
                  <Fragment key={group.groupId}>
                    {index > 0 ? <Divider style={{ backgroundColor: colors.outlineVariant }} /> : null}
                    <View style={[styles.row, group.effective && { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.default }]}>
                      <View style={styles.meta}>
                        <Text style={[styles.groupTitle, group.effective && { color: colors.onPrimaryContainer }]}>{group.label}</Text>
                        <Text style={[styles.groupStatus, group.effective && { color: colors.onPrimaryContainer }]}>{statusLabel}</Text>
                        {group.expiresOn ? (
                          <Text style={[styles.expiry, group.effective && { color: colors.onPrimaryContainer }]}>
                            Có hiệu lực đến {group.expiresOn}
                          </Text>
                        ) : null}
                      </View>
                      <Switch
                        accessibilityLabel={'Nhận lái hộ ' + group.label}
                        value={group.enabled}
                        disabled={change.isPending || state.isFetching || !state.data?.approvalRevision || (!group.enabled && Boolean(group.reasonCode))}
                        onValueChange={enabled => change.mutate({ groupId: group.groupId, enabled })}
                      />
                    </View>
                  </Fragment>
                );
              })}
            </GroupedList>
            {!hasAccepting ? (
              <Card>
                <Text style={styles.groupStatus}>
                  Chưa có loại xe đã duyệt và đang bật để nhận chuyến. Hãy bật ít nhất một nhóm xe đủ điều kiện ở trên.
                </Text>
              </Card>
            ) : null}
          </>
        ) : state.data ? (
          <Card><Text>Dịch vụ lái hộ chưa được bật.</Text></Card>
        ) : null}

        {change.error ? <Text accessibilityRole="alert" style={styles.error}>{change.error.message}</Text> : null}

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
  lead: { ...typography.body, color: colors.onSurface },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.px3, paddingVertical: spacing.px3, paddingHorizontal: spacing.spaceSm, minHeight: 56 },
  meta: { flex: 1, gap: spacing.spaceXs },
  groupTitle: { ...typography.cardTitle, color: colors.onSurface },
  groupStatus: { ...typography.label, color: colors.onSurfaceVariant },
  expiry: { ...typography.caption, color: colors.onSurfaceVariant },
  error: { ...typography.body, color: colors.error },
});
