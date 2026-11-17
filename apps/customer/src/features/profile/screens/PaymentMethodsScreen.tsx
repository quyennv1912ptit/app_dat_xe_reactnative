import { useState } from 'react';
import { RadioButton } from 'react-native-paper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useWalletOverview } from '@/lib/useWallet';
import { walletBalance, formatMoney } from '@datxe/shared';
import { Button, Card, ScreenWrapper, Typography as Text, WalletLoadState, typography } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useProfileEditor } from '../hooks/useProfileEditor';
export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { query, save } = useProfileEditor();
  const wallet = useWalletOverview();
  const [choice, setChoice] = useState<'CASH' | 'WALLET' | null>(null);
  const [saved, setSaved] = useState(false);
  const selected = choice ?? (query.data?.default_payment_method === 'WALLET' ? 'WALLET' : 'CASH');
  const balance = walletBalance(wallet.data, 'CUSTOMER');
  const confirm = async () => { try { await save.mutateAsync(selected); setSaved(true); } catch {} };
  return <ScreenWrapper>
    <ScreenHeader title="Phương thức thanh toán" onBack={() => router.back()} />
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Text style={typography.bodyMd}>Chọn phương thức mặc định. Bạn có thể chọn lại khi xác nhận chuyến hoặc đổi khi hóa đơn còn chờ thanh toán.</Text>
      <WalletLoadState loading={query.isLoading} error={query.error?.message || save.error?.message} onRetry={() => void query.refetch()} />
      <Card style={{ gap: 16 }}>
        <RadioButton.Group value={selected} onValueChange={value => { if (value === 'CASH' || value === 'WALLET') { setChoice(value); setSaved(false); } }}>
          <RadioButton.Item label="Tiền mặt" value="CASH" disabled={save.isPending} />
          <Text>Thanh toán trực tiếp cho tài xế khi kết thúc chuyến.</Text>
          <RadioButton.Item label="Ví ứng dụng" value="WALLET" disabled={save.isPending} />
          <Text>{balance === undefined ? 'Chưa tải được số dư ví.' : `Số dư hiện tại: ${formatMoney(balance)}`}</Text>
        </RadioButton.Group>
        <Text>Ví cần đủ tiền trước khi đặt xe; hệ thống thanh toán khi chuyến hoàn tất.</Text>
        <Button variant="secondary" label="Nạp tiền / Xem ví" onPress={() => router.push('/wallet')} />
      </Card>
      {saved ? <Text accessibilityRole="alert">Đã lưu phương thức thanh toán mặc định.</Text> : null}
      <Button label="Lưu phương thức mặc định" disabled={!query.data || query.isError || save.isPending} loading={save.isPending} onPress={() => void confirm()} />
    </ScrollView>
  </ScreenWrapper>;
}
