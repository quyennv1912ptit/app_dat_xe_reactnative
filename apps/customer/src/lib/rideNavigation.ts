import type { Href, useRouter } from "expo-router";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Đưa stack về Trang chủ, xóa sạch các màn đặt chuyến cũ trên stack.
 */
export function navigateHomeClean(router: Pick<AppRouter, "canDismiss" | "dismissAll" | "replace">) {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/(tabs)/home");
}

/**
 * Chuyển sang màn tìm/theo dõi chuyến từ luồng đặt chuyến mà không để lại
 * các màn chọn xe/xác nhận trong lịch sử back.
 */
export function resetToRideScreen(
  router: Pick<AppRouter, "canDismiss" | "dismissAll" | "push" | "replace">,
  destination: Href,
) {
  if (router.canDismiss()) {
    router.dismissAll();
    router.push(destination);
    return;
  }
  router.replace(destination);
}
