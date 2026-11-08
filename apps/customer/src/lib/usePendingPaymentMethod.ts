import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { persistWalletAttempt, requireWalletData, type CustomerRideDetail, type PaymentMethod } from '@datxe/shared';
import { request } from './api';
import { useSessionStore } from './store';
import { env } from '@/config/env';

export function usePendingPaymentMethod(ride: CustomerRideDetail) {
  const client = useQueryClient();
  const userId = useSessionStore(state => state.user?.id);
  return useMutation({
    mutationFn: async (method: 'CASH' | 'WALLET') => {
      const current = ride.payment;
      if (!userId || !current || current.status !== 'PENDING') throw new Error('Khoản thanh toán không còn chờ xử lý.');
      if (current.method === method) throw new Error('Hãy chọn phương thức thanh toán khác.');
      const scope = `payment-change:${env.apiUrl}:${userId}:${ride.id}:${current.method}:${method}`;
      const attempt = await persistWalletAttempt(AsyncStorage, scope, Math.max(1, current.amount));
      if (useSessionStore.getState().user?.id !== userId) throw new Error('Phiên đăng nhập đã thay đổi.');
      const payment = await requireWalletData(request<{ amount: number; method: PaymentMethod; status: 'PENDING' | 'PAID'; paidAt: string | null }>(`/customer/rides/${ride.id}/payment/method`, {
        method: 'PUT', body: { method, expectedMethod: current.method }, headers: { 'Idempotency-Key': attempt.key },
      }));
      await AsyncStorage.removeItem(scope);
      return payment;
    },
    onSuccess: async payment => {
      if (useSessionStore.getState().user?.id !== userId) return;
      client.setQueryData<CustomerRideDetail | null>(['customer', 'getCustomerRide', ride.id], current => current ? { ...current, payment, paymentMethod: payment.method } : current);
      await client.invalidateQueries({ queryKey: ['customer'] });
    },
    onError: async () => { await client.invalidateQueries({ queryKey: ['customer'] }); },
  });
}
