import { ScreenHeader } from '@/components/ScreenHeader';
import { useCreateTicket } from '@/lib/useTickets';
import { ScreenWrapper, TicketCreate } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';

export default function CreateTicketScreen() {
  const router = useRouter();
  const create = useCreateTicket();
  const [toast, setToast] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/tickets');
  };

  return (
    <ScreenWrapper>
      <ScreenHeader title="Tạo yêu cầu hỗ trợ" onBack={leave} />
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
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
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar visible={toast} onDismiss={() => setToast(false)} duration={800}>Đã gửi yêu cầu hỗ trợ</Snackbar>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
});
