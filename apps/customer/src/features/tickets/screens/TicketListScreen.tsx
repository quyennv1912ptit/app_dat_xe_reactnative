import { ScreenHeader } from '@/components/ScreenHeader';
import { useTickets } from '@/lib/useTickets';
import { ScreenWrapper, TicketList, useLanguage } from '@datxe/ui';
import { useRouter } from 'expo-router';

export default function TicketListScreen() {
  useLanguage();
  const router = useRouter();
  const tickets = useTickets();
  return (
    <ScreenWrapper>
      <ScreenHeader title="Hỗ trợ" onBack={() => router.back()} />
      <TicketList
        tickets={tickets.items}
        loading={tickets.loading}
        refreshing={tickets.refreshing}
        error={tickets.error}
        onRefresh={() => void tickets.refresh()}
        onRetry={() => void tickets.refresh()}
        onOpen={id => router.push({ pathname: '/tickets/[id]', params: { id: String(id) } })}
        onCreate={() => router.push('/tickets/new')}
      />
    </ScreenWrapper>
  );
}
