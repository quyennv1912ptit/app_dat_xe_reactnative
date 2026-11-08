import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Dialog, Portal, RadioButton } from 'react-native-paper';
import { View } from 'react-native';
import { formatMoney, walletBalance, type CustomerRideDetail } from '@datxe/shared';
import { Button, Typography as Text, useThemeColors } from '@datxe/ui';
import { useWalletOverview } from '@/lib/useWallet';
import { usePendingPaymentMethod } from '@/lib/usePendingPaymentMethod';

export function PendingPaymentMethod({ ride }: { ride: CustomerRideDetail }) {
  const router = useRouter();
  const c = useThemeColors();
  const wallet = useWalletOverview();
  const change = usePendingPaymentMethod(ride);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<'CASH' | 'WALLET'>('WALLET');
  const sending = useRef(false);
  const payment = ride.payment;
  const eligible = ride.status === 'COMPLETED' && payment?.status === 'PENDING';
  const balance = walletBalance(wallet.data, 'CUSTOMER');
  const insufficient = choice === 'WALLET' && (wallet.isError || balance === undefined || balance < (payment?.amount ?? 0));
  const submit = async () => {
    if (!eligible || insufficient || change.isPending || sending.current) return;
    sending.current = true;
    try { await change.mutateAsync(choice); setOpen(false); } catch {} finally { sending.current = false; }
  };
  return <View style={{ gap: 12 }}>
    {eligible ? <Button variant="secondary" label="Đổi phương thức thanh toán" onPress={() => { change.reset(); setChoice(payment?.method === 'CASH' ? 'WALLET' : 'CASH'); setOpen(true); }} /> : null}
    {change.error ? <Text accessibilityRole="alert" style={{ color: c.error }}>{change.error.message}</Text> : null}
    {change.isSuccess ? <Text accessibilityRole="alert">{ride.payment?.status === 'PAID' ? 'Đã đổi phương thức và thanh toán thành công. Không cần trả thêm tiền mặt.' : 'Phương thức của chuyến đã được cập nhật. Tài xế sẽ nhận được thông báo.'}</Text> : null}
    <Portal><Dialog visible={open && eligible} onDismiss={() => setOpen(false)} dismissable={!change.isPending} dismissableBackButton={!change.isPending} style={{ backgroundColor: c.surfaceContainerHigh, borderRadius: 28 }}>
      <Dialog.Title>Đổi phương thức thanh toán</Dialog.Title>
      <Dialog.Content><View style={{ gap: 16 }}>
        <Text>Chỉ áp dụng cho chuyến #{ride.id}. Tài xế sẽ được thông báo về thay đổi.</Text>
        <RadioButton.Group value={choice} onValueChange={value => { if (!change.isPending && (value === 'CASH' || value === 'WALLET')) setChoice(value); }}>
          <RadioButton.Item label="Tiền mặt" value="CASH" disabled={change.isPending} />
          <RadioButton.Item label="Ví ứng dụng" value="WALLET" disabled={change.isPending} />
        </RadioButton.Group>
        {choice === 'WALLET' ? <>
          <Text>{balance === undefined ? 'Chưa kiểm tra được số dư ví.' : `Số dư ví: ${formatMoney(balance)}`}</Text>
          <Text>Đổi sang ví sẽ thanh toán ngay {formatMoney(payment?.amount ?? 0)}. Sau khi thanh toán không thể đổi tiếp.</Text>
          {insufficient ? <>
            <Text style={{ color: c.error }}>Cần đủ số dư ví để thực hiện thanh toán.</Text>
            <Button variant="secondary" label="Nạp tiền vào ví" disabled={change.isPending} onPress={() => { setOpen(false); router.push('/wallet/top-up'); }} />
            <Button variant="ghost" label="Kiểm tra lại số dư" loading={wallet.isFetching} onPress={() => void wallet.refetch()} />
          </> : null}
        </> : <Text>Chỉ trả tiền mặt sau khi ứng dụng xác nhận đổi thành công.</Text>}
        {change.error ? <Text accessibilityRole="alert" style={{ color: c.error }}>{change.error.message}</Text> : null}
        <Button label={choice === 'WALLET' ? `Đổi và thanh toán ${formatMoney(payment?.amount ?? 0)}` : 'Xác nhận đổi'}
          loading={change.isPending} disabled={!eligible || choice === payment?.method || insufficient} onPress={() => void submit()} />
        <Button variant="ghost" label="Hủy" disabled={change.isPending} onPress={() => setOpen(false)} />
      </View></Dialog.Content>
    </Dialog></Portal>
  </View>;
}
