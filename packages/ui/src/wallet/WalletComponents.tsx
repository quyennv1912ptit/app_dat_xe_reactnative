import { memo, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ActivityIndicator, Dialog, Divider, Portal } from 'react-native-paper';
import { formatMoney, getLocale, parseWalletAmount, walletAttempt, type WalletAttempt, type WalletEntry } from '@datxe/shared';
import { Button, Card, FilterChip, MoneyText, PaperTextInput, Typography as Text } from '../components';
import { useThemeColors } from '../theme/ThemeProvider';
import { borderRadius, spacing, typography } from '../theme/colors';

export function WalletBalanceCard({
  title,
  balance,
  description,
  accent = 'neutral',
  style,
  children,
}: {
  title: string;
  balance?: number;
  description: string;
  accent?: 'primary' | 'neutral';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const c = useThemeColors();
  const containerBg = accent === 'primary' ? c.surfaceContainerHigh : c.surfaceContainerLow;
  return (
    <Card style={[s.balanceCard, { backgroundColor: containerBg }, style]}>
      <Text style={[typography.labelLg, { color: c.onSurfaceVariant }]}>{title}</Text>
      <MoneyText
        value={balance}
        variant="headline"
        accessibilityLabel={`${title}: ${balance === undefined ? 'Chưa tải được số dư' : formatMoney(balance)}`}
        color={balance !== undefined && balance < 0 ? c.error : accent === 'primary' ? c.primary : c.onSurface}
      />
      <Text style={[typography.labelMd, { color: c.onSurfaceVariant }]}>{description}</Text>
      {children ? <View style={s.actions}>{children}</View> : null}
    </Card>
  );
}

export function WalletLoadState({ loading, error, onRetry }: { loading?: boolean; error?: string; onRetry: () => void }) {
  const c = useThemeColors();
  return (
    <>
      {loading ? <ActivityIndicator accessibilityLabel="Đang tải ví" /> : null}
      {error ? (
        <Card style={s.card}>
          <Text accessibilityRole="alert" style={{ color: c.error }}>{error}</Text>
          <Button variant="secondary" label="Thử lại" onPress={onRetry} />
        </Card>
      ) : null}
    </>
  );
}

const transactionLabel = {
  TOP_UP: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  RIDE_PAYMENT: 'Thanh toán chuyến',
  COMMISSION_FEE: 'Chiết khấu chuyến',
  REFUND: 'Hoàn tiền',
};

export const walletStatusLabel = {
  PENDING: 'Đang chờ xử lý',
  SUCCESS: 'Đã hoàn tất',
  FAILED: 'Không thành công',
};

export const WalletEntryCard = memo(function WalletEntryCard({
  item,
  onOpenRide,
}: {
  item: WalletEntry;
  onOpenRide: (id: number) => void;
}) {
  const c = useThemeColors();
  return (
    <Card style={s.entryCard}>
      <View style={s.row}>
        <View style={s.grow}>
          <Text style={typography.titleMd}>{transactionLabel[item.transactionType] ?? item.transactionType}</Text>
          <Text style={[typography.labelMd, { color: c.onSurfaceVariant }]}>
            {item.walletType === 'CREDIT' ? 'Ví tín dụng' : item.walletType === 'CASH' ? 'Ví tiền mặt' : 'Ví ứng dụng'}
            {' · '}
            <Text style={{ color: item.status === 'FAILED' ? c.error : c.onSurfaceVariant }}>
              {walletStatusLabel[item.status]}
            </Text>
          </Text>
        </View>
        <MoneyText
          value={item.amount}
          signed
          variant="title"
          color={item.status === 'FAILED' ? c.onSurfaceVariant : item.amount > 0 ? c.primary : c.onSurface}
          style={s.entryAmount}
        />
      </View>
      {item.description ? <Text style={typography.bodyMd}>{item.description}</Text> : null}
      <Divider />
      <View style={s.metaRow}>
        <Text style={[typography.labelMd, { color: c.onSurfaceVariant }]}>{new Date(item.createdAt).toLocaleString(getLocale())}</Text>
        <Text selectable style={[typography.labelMd, { color: c.onSurfaceVariant }]}>GD #{item.transactionId}</Text>
      </View>
      {item.balanceAfter != null ? (
        <Text style={[typography.labelMd, s.amount, { color: c.onSurfaceVariant }]}>
          Số dư sau GD: {formatMoney(item.balanceAfter)}
        </Text>
      ) : null}
      {item.withdrawalId ? (
        <Text selectable style={typography.labelMd}>
          Yêu cầu rút #{item.withdrawalId}{item.status === 'FAILED' ? ' · Khoản giữ tiền đã được hoàn lại' : ''}
        </Text>
      ) : null}
      {item.referenceTripId ? (
        <Button variant="ghost" label={`Xem chuyến #${item.referenceTripId}`} onPress={() => onOpenRide(item.referenceTripId!)} />
      ) : null}
    </Card>
  );
});

export function WalletHistorySection({ items, loading, error, hasMore, loadingMore, onMore, onRetry, onOpenRide }: {
  items: WalletEntry[]; loading: boolean; error?: string; hasMore: boolean; loadingMore: boolean;
  onMore: () => void; onRetry: () => void; onOpenRide: (id: number) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={s.stack}>
      <Text accessibilityRole="header" style={typography.titleLg}>Lịch sử giao dịch</Text>
      <WalletLoadState loading={loading} error={error} onRetry={onRetry} />
      {!loading && !error && !items.length ? (
        <Card style={s.card}>
          <Text>Chưa có giao dịch. Các khoản nạp, thanh toán và hoàn tiền sẽ hiển thị tại đây.</Text>
        </Card>
      ) : null}
      {items.map(item => <WalletEntryCard key={item.transactionId} item={item} onOpenRide={onOpenRide} />)}
      {hasMore ? (
        <Button variant="secondary" label="Xem thêm giao dịch" loading={loadingMore} onPress={onMore} />
      ) : items.length && !error ? (
        <Text style={{ color: c.onSurfaceVariant }}>Đã hiển thị toàn bộ giao dịch.</Text>
      ) : null}
    </View>
  );
}

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000] as const;
const formatAmountInput = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function WalletMoneyForm({
  mode,
  maxAmount,
  available,
  suggestedAmount,
  suggestedLabel,
  onSubmit,
  onDone,
}: {
  mode: 'topup' | 'withdraw';
  maxAmount: number;
  available?: number;
  suggestedAmount?: number;
  suggestedLabel?: string;
  onSubmit: (amount: number, key: string) => Promise<unknown>;
  onDone: () => void;
}) {
  const c = useThemeColors();
  const [amount, setAmount] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const attempt = useRef<WalletAttempt | undefined>(undefined);
  const submitting = useRef(false);
  const value = parseWalletAmount(amount, maxAmount);
  const retrying = value !== null && attempt.current?.amount === value;
  const exceeds = mode === 'withdraw' && value !== null && !retrying && (available === undefined || value > available);
  const presets = PRESET_AMOUNTS.filter(
    x => x <= maxAmount && (mode !== 'withdraw' || (available !== undefined && x <= available)),
  );
  const maxWithdrawable = mode === 'withdraw' && available !== undefined && available > 0
    ? Math.min(Math.floor(available), maxAmount)
    : null;
  const validSuggested = suggestedAmount !== undefined
    && Number.isSafeInteger(suggestedAmount)
    && suggestedAmount > 0
    && suggestedAmount <= maxAmount
    && (mode !== 'withdraw' || (available !== undefined && suggestedAmount <= available))
    ? suggestedAmount
    : null;

  const submit = async () => {
    if (value === null || exceeds || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    attempt.current = walletAttempt(attempt.current, value);
    try {
      await onSubmit(value, attempt.current.key);
      setReview(false);
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa xử lý được giao dịch. Vui lòng thử lại.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  if (done) {
    return (
      <Card style={s.card}>
        <Text accessibilityRole="alert" style={typography.titleLg}>
          {mode === 'topup' ? 'Nạp tiền thành công' : 'Đã gửi yêu cầu rút tiền'}
        </Text>
        <Text>
          {mode === 'topup'
            ? 'Số dư đã được cập nhật.'
            : 'Số tiền được tạm giữ để chờ duyệt. Nếu bị từ chối, tiền sẽ tự động hoàn về ví tiền mặt.'}
        </Text>
        <Button label="Hoàn tất" onPress={onDone} />
      </Card>
    );
  }

  return (
    <Card style={s.card}>
      <Text style={typography.titleLg}>{mode === 'topup' ? 'Nạp tiền giả lập' : 'Tạo yêu cầu rút tiền'}</Text>
      <Text style={{ color: c.onSurfaceVariant }}>
        {mode === 'topup'
          ? 'Chế độ thử nghiệm, không thu tiền thật.'
          : 'Chỉ rút từ ví tiền mặt. Số tiền sẽ được giữ ngay khi gửi yêu cầu và chờ quản trị viên duyệt.'}
      </Text>
      <PaperTextInput
        label="Số tiền (đ)"
        draftValue={formatAmountInput(amount)}
        onChangeText={text => setAmount(text.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={15}
        disabled={busy}
        error={Boolean(amount && (value === null || exceeds))}
      />
      {presets.length || validSuggested || maxWithdrawable ? (
        <View style={s.chips}>
          {validSuggested ? (
            <FilterChip
              key={`suggested-${validSuggested}`}
              label={suggestedLabel ?? formatMoney(validSuggested, { nonBreaking: true })}
              selected={value === validSuggested}
              disabled={busy}
              onPress={() => setAmount(String(validSuggested))}
            />
          ) : null}
          {presets.map(x => (
            <FilterChip
              key={x}
              label={formatMoney(x, { nonBreaking: true })}
              selected={value === x}
              disabled={busy}
              onPress={() => setAmount(String(x))}
            />
          ))}
          {maxWithdrawable && !presets.includes(maxWithdrawable as typeof PRESET_AMOUNTS[number]) ? (
            <FilterChip
              key={`max-${maxWithdrawable}`}
              label={`Tối đa (${formatMoney(maxWithdrawable, { nonBreaking: true })})`}
              selected={value === maxWithdrawable}
              disabled={busy}
              onPress={() => setAmount(String(maxWithdrawable))}
            />
          ) : null}
        </View>
      ) : null}
      <Text style={{ color: exceeds || (amount && value === null) ? c.error : c.onSurfaceVariant }}>
        {exceeds
          ? 'Số dư ví tiền mặt không đủ.'
          : mode === 'withdraw'
            ? `Số dư có thể rút: ${available === undefined ? 'Chưa xác định' : formatMoney(available)}. Nhập số nguyên đồng.`
            : `Nhập số nguyên từ 1 đến ${formatMoney(maxAmount)}.`}
      </Text>
      <Button label="Tiếp tục" disabled={value === null || exceeds || busy} onPress={() => { setError(''); setReview(true); }} />
      <Portal>
        <KeyboardAvoidingView behavior="padding" pointerEvents="box-none" style={s.dialogHost}>
          <Dialog
            visible={review}
            dismissable={!busy}
            dismissableBackButton={!busy}
            onDismiss={() => setReview(false)}
            style={{ borderRadius: 28, backgroundColor: c.surfaceContainerHigh }}
          >
            <Dialog.Title>{mode === 'topup' ? 'Xác nhận nạp giả lập' : 'Xác nhận rút tiền'}</Dialog.Title>
            <Dialog.ScrollArea style={s.dialogScrollArea}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.dialogBody}>
                <MoneyText value={value} variant="headline" />
                <Text>
                  {mode === 'topup'
                    ? 'Tiền thử nghiệm sẽ được cộng vào ví của bạn.'
                    : 'Khoản tiền này được trừ khỏi số dư khả dụng để chờ duyệt.'}
                </Text>
                {error ? <Text accessibilityRole="alert" style={{ color: c.error }}>{error}</Text> : null}
              </ScrollView>
            </Dialog.ScrollArea>
            <View style={s.dialogActions}>
              <Button label={mode === 'topup' ? 'Xác nhận nạp' : 'Gửi yêu cầu rút'} loading={busy} onPress={() => void submit()} />
              <Button variant="ghost" label="Hủy" disabled={busy} onPress={() => setReview(false)} />
            </View>
          </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </Card>
  );
}

const s = StyleSheet.create({
  balanceCard: { padding: spacing.spaceMd, gap: spacing.spaceSm, borderRadius: borderRadius.default },
  card: { padding: spacing.spaceLg, gap: spacing.px3, borderRadius: borderRadius.default },
  entryCard: { padding: spacing.spaceMd, gap: spacing.spaceSm, borderRadius: borderRadius.default },
  stack: { gap: spacing.spaceMd },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.px3 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  grow: { flexGrow: 1, flexShrink: 1, minWidth: 140, gap: spacing.xxs },
  actions: { gap: spacing.spaceSm, paddingTop: spacing.spaceXs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.spaceSm },
  chip: { minHeight: 48, justifyContent: 'center' },
  amount: { fontVariant: ['tabular-nums'], flexShrink: 1 },
  entryAmount: { flexShrink: 0, textAlign: 'right' },
  dialogHost: { flex: 1, justifyContent: 'center' },
  dialogScrollArea: { maxHeight: 240, paddingHorizontal: 0, borderTopWidth: 0, borderBottomWidth: 0 },
  dialogBody: { paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  dialogActions: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 4, gap: 8 },
});
