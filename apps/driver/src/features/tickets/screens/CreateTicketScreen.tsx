import { DriverPage } from '@/components/DriverPage';
import { useCreateTicket } from '@/lib/useTickets';
import { TicketCreate } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Snackbar } from 'react-native-paper';

export default function CreateTicketScreen() {
  const router = useRouter();
  const create = useCreateTicket();
  const [toast, setToast] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <DriverPage title="Tạo yêu cầu hỗ trợ" form backFallback="/tickets">
        <TicketCreate
          pending={create.isPending}
          error={create.error?.message}
          onSubmit={draft =>
            create.mutateAsync(draft, {
              onSuccess: (ticket) => {
                setToast(true);
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => router.replace({ pathname: '/tickets/[id]', params: { id: String(ticket.id) } }), 900);
              },
            })
          }
        />
      </DriverPage>
      <Snackbar visible={toast} onDismiss={() => setToast(false)} duration={800}>Đã gửi yêu cầu hỗ trợ</Snackbar>
    </>
  );
}
