import { HeaderIconButton,ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
ActivityIndicator,
Image,
KeyboardAvoidingView,
Platform,
Pressable,
ScrollView,
Text,
TextInput,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/CustomerChatScreenParts';
import { useCustomerChat } from '../hooks/useCustomerChat';
export default function CustomerChatScreen() {
const { router, rideId, ride, messages, draft, setDraft, loading, loadingOlder, sending, hasMore, error, refresh, loadOlder, sendText, sendImage, chatEnabled } = useCustomerChat();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Nhắn tin tài xế"
        subtitle={`Chuyến #${rideId}${ride?.driverId ? ` · Tài xế #${ride.driverId}` : ''}`}
        onBack={() => router.back()}
        rightContent={<HeaderIconButton icon="refresh" accessibilityLabel="Làm mới tin nhắn" onPress={() => void refresh(true)} tone="primary" />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {hasMore ? <Pressable disabled={loadingOlder} onPress={() => void loadOlder()} style={styles.loadOlder}>
            {loadingOlder ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.link}>Tải tin nhắn cũ</Text>}
          </Pressable> : null}
          {loading && messages.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
          {!loading && messages.length === 0 ? <View style={styles.empty}>
            <MaterialIcons name="chat-bubble-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyTitle}>{chatEnabled ? 'Bắt đầu cuộc trò chuyện' : 'Chat sẽ mở khi có tài xế nhận chuyến'}</Text>
            <Text style={styles.emptyCopy}>{chatEnabled ? 'Trao đổi với tài xế về điểm đón hoặc chuyến đi.' : 'Backend chỉ mở chat trong các trạng thái từ khi tài xế được phân công đến khi hoàn tất bàn giao.'}</Text>
          </View> : null}
          {messages.map((message) => {
            const mine = message.senderRole === 'CUSTOMER';
            return <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleDriver]}>
                {message.attachmentUrl ? <Image source={{ uri: message.attachmentUrl }} style={styles.attachment} resizeMode="cover" /> : null}
                {message.content ? <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.content}</Text> : null}
                {!message.content && !message.attachmentUrl ? <Text style={[styles.messageText, mine && styles.messageTextMine]}>Tin nhắn</Text> : null}
                <Text style={[styles.messageTime, mine && styles.messageTimeMine]}>{new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>;
          })}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </ScrollView>
        {!chatEnabled ? <View style={styles.closedNotice}><Text style={styles.closedText}>{ride ? 'Cuộc trò chuyện hiện đã đóng theo trạng thái chuyến.' : 'Đang tải thông tin chuyến.'}</Text></View> : null}
        <View style={styles.composer}>
          <Pressable accessibilityLabel="Gửi ảnh" disabled={sending || !chatEnabled} onPress={() => void sendImage()} style={[styles.imageButton, (!chatEnabled || sending) && styles.disabled]}>
            <MaterialIcons name="image" size={23} color={colors.primary} />
          </Pressable>
          <TextInput
            accessibilityLabel="Tin nhắn"
            editable={chatEnabled && !sending}
            value={draft}
            onChangeText={setDraft}
            placeholder={chatEnabled ? 'Nhập tin nhắn…' : 'Chat chưa khả dụng'}
            maxLength={1000}
            multiline
            style={styles.input}
          />
          <Pressable accessibilityLabel="Gửi tin nhắn" disabled={!draft.trim() || sending || !chatEnabled} onPress={() => void sendText()} style={[styles.sendButton, (!draft.trim() || sending || !chatEnabled) && styles.disabled]}>
            {sending ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <MaterialIcons name="send" size={21} color={colors.onPrimary} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
