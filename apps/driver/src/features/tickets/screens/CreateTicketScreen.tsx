import { DriverPage } from '@/components/DriverPage';
import { useCreateTicket } from '@/lib/useTickets';
import { TicketCreate } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Snackbar } from 'react-native-paper';

export default function CreateTicketScreen() {
  const router = useRouter();
  const create = useCreateTicket();
  const [toast, setToast] = useState(false);

  return (
    <>
      <DriverPage title="Tạo yêu cầu hỗ trợ" form backFallback="/tickets">
        <TicketCreate
          pending={create.isPending}
          error={create.error?.message}
          onSubmit={draft => create.mutateAsync(draft, { onSuccess: () => { setToast(true); setTimeout(() => router.back(), 900); } })}
        />
      </DriverPage>
      <Snackbar visible={toast} onDismiss={() => setToast(false)} duration={800}>Đã gửi yêu cầu hỗ trợ</Snackbar>
    </>
  );
}
