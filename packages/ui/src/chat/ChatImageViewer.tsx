import { ImageViewer } from "../components/ImageViewer";

/**
 * Trình xem ảnh trong chat/biên bản. Giữ tên cũ để không phá vỡ import hiện có;
 * toàn bộ khả năng zoom/xoay/lật nằm trong `ImageViewer` dùng chung.
 */
export function ChatImageViewer({ uri, title = "Ảnh tin nhắn", onClose }: { uri: string; title?: string; onClose: () => void }) {
  return <ImageViewer uri={uri} title={title} onClose={onClose} />;
}
