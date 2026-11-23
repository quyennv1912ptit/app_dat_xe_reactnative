import { loadOlderTicketMessages, useSendTicketMessage, useTicketDetail, useTicketMessages } from '@/lib/useTickets';
import { pickTicketImage } from '@/lib/supportImages';
import { uploadDriverImage } from '@/lib/uploadImage';
import { TicketChat } from '@datxe/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';

export default function TicketChatScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const id = Number(rawId);
  const valid = Number.isSafeInteger(id) && id > 0;
  const detail = useTicketDetail(id, valid);
  const messages = useTicketMessages(id, valid);
  const send = useSendTicketMessage(id);
  const uploaded = useRef<{ key: string; url: string } | null>(null);
  const list = messages.data ?? detail.data?.messages ?? [];
  const error = !valid ? 'Thiếu mã yêu cầu hỗ trợ.' : detail.error?.message || messages.error?.message || send.error?.message;

  return (
    <TicketChat
      key={id}
      ticket={detail.data?.ticket ?? null}
      messages={list}
      currentRole="DRIVER"
      loading={detail.isLoading || messages.isLoading}
      sending={send.isPending}
      error={error}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/tickets'))}
      onRefresh={() => { void detail.refetch(); void messages.refetch(); }}
      hasOlderMessages={detail.data?.hasOlderMessages}
      onLoadOlder={beforeId => loadOlderTicketMessages(id, beforeId)}
      onPickImage={pickTicketImage}
      onSend={async ({ body, image, clientMessageId }) => {
        if (image && uploaded.current?.key !== clientMessageId) {
          const { secureUrl } = await uploadDriverImage(image, 'SUPPORT');
          uploaded.current = { key: clientMessageId, url: secureUrl };
        }
        const imageUrl = image ? uploaded.current?.url : undefined;
        await send.mutateAsync({ body, imageUrl, clientMessageId });
        uploaded.current = null;
      }}
    />
  );
}
