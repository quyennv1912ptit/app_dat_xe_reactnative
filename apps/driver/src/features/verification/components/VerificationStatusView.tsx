import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Button,
  Card,
  GroupedList,
  KeyValueRow,
  SettingsListItem,
  SharedStatusBadge,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import type { Application, VerificationWarning } from '../api';
import {
  formatVnDate,
  historyActionLabels,
  restrictionLabels,
  statusLabels,
  todayVnIso,
} from '../verificationLabels';
import { slots, type SlotKey } from '../workflow';
import { AlertBanner, SlotPhotoFrame, WarningBannerList } from './VerificationShared';

/** Compact status banner shown above active draft / NEEDS_MORE_INFO steps. */
export function EditingStatusBanner({
  app,
  targetLabels,
  needsCapture,
  busy,
  picking,
  pending,
  onJumpCapture,
  onJumpFields,
  onStartReverify,
  onCancelReverify,
}: {
  app: Application;
  targetLabels: readonly string[];
  needsCapture: boolean;
  busy: string;
  picking: boolean;
  pending: boolean;
  onJumpCapture: () => void;
  onJumpFields: () => void;
  onStartReverify: () => void;
  onCancelReverify: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const headline = app.status === 'DRAFT' && app.approvedRevision != null
    ? 'Đang cập nhật giấy tờ mới'
    : (statusLabels[app.status] ?? app.status);

  return (
    <Card style={styles.bannerCard}>
      <View style={styles.bannerHeaderRow}>
        <Text style={styles.bannerHeadline}>{headline}</Text>
        <StatusBadge kind="approval" value={app.status} />
      </View>
      {app.reason ? (
        app.status === 'REJECTED' ? (
          <AlertBanner tone="error" icon="error-outline" role="alert" message={`Lý do từ chối: ${app.reason}`} />
        ) : app.status === 'NEEDS_MORE_INFO' ? (
          <AlertBanner tone="warning" icon="feedback" message={app.reason} />
        ) : (
          <Text style={styles.bodyText}>{app.reason}</Text>
        )
      ) : null}
      {app.identityLocked ? (
        <AlertBanner
          tone="info"
          icon="lock-outline"
          message="Thông tin định danh đã xác minh (số định danh, họ tên, ngày sinh) được giữ nguyên. Bạn có thể cập nhật CCCD gia hạn, GPLX hoặc ảnh chân dung mới."
        />
      ) : null}
      {targetLabels.length ? (
        <AlertBanner tone="warning" icon="edit-note" message={`Cần bổ sung · ${targetLabels.join(', ')}`} />
      ) : null}
      {app.status === 'NEEDS_MORE_INFO' ? (
        <Button
          variant="secondary"
          label={needsCapture ? 'Đi tới ảnh cần bổ sung' : 'Đi tới sửa thông tin'}
          onPress={needsCapture ? onJumpCapture : onJumpFields}
        />
      ) : null}
      {app.status === 'REJECTED' && !pending ? (
        <>
          <Text style={styles.mutedText}>
            Bạn có thể cập nhật lại ảnh giấy tờ, chỉnh sửa thông tin và gửi yêu cầu xét duyệt mới.
          </Text>
          <Button
            label="Tạo yêu cầu hồ sơ mới"
            disabled={Boolean(busy) || picking}
            onPress={onStartReverify}
          />
        </>
      ) : null}
      {app.status === 'DRAFT' && app.approvedRevision != null && !app.identityHold ? (
        <Button
          variant="ghost"
          label="Hủy cập nhật"
          disabled={Boolean(busy)}
          onPress={onCancelReverify}
        />
      ) : null}
    </Card>
  );
}

/** Clean read-only view for APPROVED, SUBMITTED, UNDER_REVIEW, and verified-baseline statuses. */
export function VerifiedBaselineView({
  app,
  busy,
  showHistory,
  onToggleHistory,
  onStartReverify,
}: {
  app: Application;
  busy: string;
  showHistory: boolean;
  onToggleHistory: () => void;
  onStartReverify: () => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const confirmed = app.approvedDocument?.confirmed ?? app.document?.confirmed;
  const rawCccdId = typeof confirmed?.cccd_id === 'string' ? confirmed.cccd_id.trim() : '';
  const verifiedMaskedCccd = app.lockedIdentity?.maskedCccdId
    ?? (rawCccdId.length >= 4 ? '*'.repeat(rawCccdId.length - 4) + rawCccdId.slice(-4) : 'Đã xác minh');
  const fullName = app.lockedIdentity?.fullName
    ?? (typeof confirmed?.cccd_name === 'string' ? confirmed.cccd_name : '');
  const cccdExpiry = typeof confirmed?.cccd_expiry_date === 'string' ? confirmed.cccd_expiry_date : '';
  const todayIso = todayVnIso();
  const cccdExpired = Boolean(cccdExpiry && cccdExpiry < todayIso);
  const cccdExpiryFormatted = formatVnDate(cccdExpiry);
  const gplxClasses = Array.isArray(confirmed?.gplx_classes)
    ? confirmed.gplx_classes.join(', ')
    : (typeof confirmed?.gplx_classes === 'string' && confirmed.gplx_classes.trim() ? confirmed.gplx_classes.trim() : '—');
  const gplxExpiry = typeof confirmed?.expiry_date === 'string' ? confirmed.expiry_date : '';
  const gplxNoExpiry = confirmed?.no_expiry === true;
  const gplxExpired = Boolean(!gplxNoExpiry && gplxExpiry && gplxExpiry < todayIso);
  const gplxExpiryFormatted = formatVnDate(gplxExpiry);
  const gplxValidity = gplxNoExpiry
    ? 'Không thời hạn'
    : gplxExpired
      ? `Đã hết hạn (${gplxExpiryFormatted})`
      : gplxExpiryFormatted
        ? `Còn hạn đến ${gplxExpiryFormatted}`
        : 'Chưa rõ thời hạn';

  const statusHeadline = app.identityHold
    ? 'Tạm giữ để kiểm tra danh tính'
    : app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
      ? 'Đang chờ duyệt bản cập nhật mới'
      : 'Hồ sơ đã xác minh';

  return (
    <View style={styles.stack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.headline}>{statusHeadline}</Text>
          <StatusBadge
            kind="approval"
            value={app.identityHold ? 'PENDING' : 'APPROVED'}
            contextLabel="Xét duyệt hồ sơ"
            style={styles.heroBadge}
          />
          <Text style={styles.mutedText}>
            Thông tin định danh đã xác minh không thể tự ý thay đổi.
          </Text>
        </View>

        {app.eligibilityStatus?.restrictionReason ? (
          <AlertBanner
            tone="error"
            icon="error-outline"
            role="alert"
            message={restrictionLabels[app.eligibilityStatus.restrictionReason] ?? app.identityHoldReason ?? 'Quyền nhận chuyến tạm thời bị hạn chế.'}
          />
        ) : null}

        {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && !app.identityHold ? (
          <AlertBanner
            tone="info"
            icon="hourglass-top"
            message="Bản cập nhật giấy tờ mới đang chờ admin xét duyệt. Quyền nhận chuyến từ giấy tờ cũ còn hạn vẫn được giữ nguyên."
          />
        ) : null}

        {app.status === 'REJECTED' ? (
          <AlertBanner
            tone={app.identityHold ? 'error' : 'warning'}
            icon={app.identityHold ? 'error-outline' : 'info-outline'}
            role="alert"
            message={app.identityHold
              ? `Lần cập nhật gần nhất chưa được duyệt${app.reason ? ': ' + app.reason : '.'}`
              : `Lần cập nhật gần nhất chưa được duyệt${app.reason ? ': ' + app.reason : '.'} Hồ sơ đã xác minh trước đó vẫn còn hiệu lực.`}
          />
        ) : null}
      </Card>

      <GroupedList title="Giấy tờ đã xác minh">
        <View style={styles.docSection}>
          <View style={styles.docRowTop}>
            <Text style={styles.docTitle}>Căn cước công dân</Text>
            <SharedStatusBadge
              label={cccdExpired ? 'Đã hết hạn' : 'Đã xác minh'}
              tone={cccdExpired ? 'danger' : 'success'}
              icon={cccdExpired ? 'error-outline' : 'check-circle'}
            />
          </View>
          <View accessible accessibilityLabel={`Số định danh: ${verifiedMaskedCccd}`}>
            <KeyValueRow label="Số định danh" value={verifiedMaskedCccd} />
          </View>
          {fullName ? <KeyValueRow label="Họ và tên" value={fullName} tabular={false} /> : null}
          {cccdExpiryFormatted ? <KeyValueRow label="Có giá trị đến" value={cccdExpiryFormatted} /> : null}
        </View>

        <View style={styles.docSection}>
          <View style={styles.docRowTop}>
            <Text style={styles.docTitle}>Giấy phép lái xe</Text>
            <SharedStatusBadge
              label={gplxExpired ? 'Đã hết hạn' : 'Đã xác minh'}
              tone={gplxExpired ? 'danger' : 'success'}
              icon={gplxExpired ? 'error-outline' : 'check-circle'}
            />
          </View>
          <KeyValueRow label="Hạng bằng" value={gplxClasses === '—' ? '—' : `Hạng ${gplxClasses}`} tabular={false} />
          <KeyValueRow label="Thời hạn" value={gplxValidity} />
        </View>

        <View style={styles.docSection}>
          <View style={styles.docRowTop}>
            <Text style={styles.docTitle}>Ảnh chân dung</Text>
            <SharedStatusBadge label="Đã xác minh" tone="success" icon="check-circle" />
          </View>
          <Text style={styles.mutedText}>Đã được admin kiểm tra</Text>
        </View>
      </GroupedList>

      <View style={styles.buttonStack}>
        {app.status === 'APPROVED' || app.status === 'REJECTED' ? (
          <Button
            variant="secondary"
            label="Cập nhật giấy tờ"
            disabled={Boolean(busy)}
            onPress={onStartReverify}
          />
        ) : null}
      </View>

      <GroupedList title="Tra cứu hồ sơ">
        <SettingsListItem
          title={showHistory ? 'Ẩn lịch sử xác minh' : 'Xem lịch sử xác minh'}
          description={app.history?.length ? `${app.history.length} bản ghi cập nhật` : 'Chưa có lịch sử cập nhật'}
          icon={showHistory ? 'expand-less' : 'history'}
          onPress={onToggleHistory}
        />
      </GroupedList>

      {showHistory ? (
        <Card style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Lịch sử xác minh</Text>
          {app.history?.length ? app.history.map((entry, idx) => (
            <View key={entry.revision + ':' + entry.action + ':' + idx}>
              {idx > 0 ? <Divider style={{ backgroundColor: colors.outlineVariant, marginVertical: spacing.spaceSm }} /> : null}
              <View style={styles.historyRow}>
                <Text style={styles.docTitle}>
                  {historyActionLabels[entry.action] ?? entry.action} · Bản {entry.revision}
                </Text>
                <Text style={styles.mutedText}>
                  {new Date(entry.at).toLocaleString('vi-VN')} · {entry.role === 'admin' ? 'Quản trị viên' : 'Tài xế'}
                </Text>
                {entry.metadata?.reason ? <Text style={styles.bodyText}>Lý do: {entry.metadata.reason}</Text> : null}
              </View>
            </View>
          )) : <Text style={styles.mutedText}>Chưa có lịch sử cập nhật.</Text>}
        </Card>
      ) : null}
    </View>
  );
}

/** Dedicated tracking view when initial submission is awaiting review or rejected without baseline. */
export function PendingReviewView({
  app,
  warnings,
  busy,
  resolvedUri,
  onPreviewSaved,
  onGoHome,
}: {
  app: Application;
  warnings: readonly VerificationWarning[];
  busy: boolean;
  resolvedUri: (key: SlotKey) => string | undefined;
  onPreviewSaved: (key: SlotKey) => void;
  onGoHome: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const colors = useThemeColors();
  const capturedSlots = slots.filter(([key]) => Boolean(app.document?.captures[key]));
  const waiting = app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW';
  const [showNotes, setShowNotes] = useState(false);
  const urgent = warnings.filter(warning => warning.blocksSubmission || warning.blocksActivation
    || warning.severity === 'CRITICAL' || warning.severity === 'BLOCKING');
  const notes = warnings.filter(warning => !urgent.includes(warning));

  return (
    <View style={styles.stack}>
      {waiting ? (
        <Card style={styles.heroCard}>
          <View style={styles.waitingHeader}>
            <View style={[styles.waitingIcon, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="hourglass-top" size={24} color={colors.onPrimaryContainer} importantForAccessibility="no" />
            </View>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.headline}>Hồ sơ đang chờ xét duyệt</Text>
              <Text style={styles.mutedText}>
                Bạn sẽ nhận thông báo khi có kết quả hoặc cần bổ sung hồ sơ.
              </Text>
            </View>
          </View>
          <Button variant="secondary" label="Quay về trang chủ" onPress={onGoHome} />
        </Card>
      ) : null}

      <WarningBannerList items={waiting ? urgent : warnings} />
      {waiting && notes.length > 0 ? (
        <Card style={styles.historyCard}>
          <Button variant="ghost" label={showNotes ? 'Thu gọn lưu ý hồ sơ' : 'Xem lưu ý của hồ sơ đã nộp'}
            onPress={() => setShowNotes(value => !value)} />
          {showNotes ? <WarningBannerList items={notes} /> : null}
        </Card>
      ) : null}

      {capturedSlots.length ? (
        <Card style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Ảnh giấy tờ đã nộp</Text>
          <View style={styles.photoGrid}>
            {capturedSlots.map(([key, label]) => (
              <View key={key} style={styles.photoTileWrap}>
                <Text style={styles.tileLabel}>{label}</Text>
                <SlotPhotoFrame
                  uri={resolvedUri(key)}
                  label={label}
                  hasSavedCapture={Boolean(app.document?.captures[key])}
                  isSelfie={key === 'selfie'}
                  tile
                  busy={busy}
                  onLoadSaved={() => onPreviewSaved(key)}
                />
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    stack: { gap: spacing.spaceMd },
    bannerCard: { gap: spacing.spaceSm },
    bannerHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.spaceSm },
    bannerHeadline: { ...typography.sectionTitle, color: colors.onSurface, flexShrink: 1 },
    heroCard: { gap: spacing.px3 },
    heroHeader: { gap: spacing.spaceSm },
    heroBadge: { alignSelf: 'flex-start' },
    heroTitleWrap: { flex: 1, gap: spacing.xxs },
    headline: { ...typography.sectionTitle, color: colors.onSurface },
    sectionTitle: { ...typography.sectionTitle, color: colors.onSurface },
    bodyText: { ...typography.body, color: colors.onSurface },
    mutedText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    docSection: { paddingVertical: spacing.spaceSm, gap: spacing.spaceXs },
    docRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.spaceSm },
    docTitle: { ...typography.cardTitle, color: colors.onSurface, flexShrink: 1 },
    buttonStack: { gap: spacing.spaceSm },
    historyCard: { gap: spacing.spaceSm },
    historyRow: { gap: spacing.xxs },
    waitingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.px3 },
    waitingIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.spaceSm },
    photoTileWrap: { width: '48%', minWidth: 140, flexGrow: 1, gap: spacing.xxs },
    tileLabel: { ...typography.label, color: colors.onSurface },
  });
