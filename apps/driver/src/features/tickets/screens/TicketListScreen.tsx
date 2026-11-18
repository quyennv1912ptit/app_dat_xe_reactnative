import { DriverPage } from '@/components/DriverPage';
import { useTickets } from '@/lib/useTickets';
import { TicketList } from '@datxe/ui';
import { useRouter } from 'expo-router';

export default function TicketListScreen() {
  const router = useRouter();
  const tickets = useTickets();
  return (
    <DriverPage title="Hộp thư hỗ trợ" scroll={false} backFallback="/support">
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
    </DriverPage>
  );
}
