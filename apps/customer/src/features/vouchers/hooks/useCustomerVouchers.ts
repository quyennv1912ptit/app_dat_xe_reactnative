import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { getVoucherPresentation } from '@/lib/voucherPresentation';
import { translate as i18nT } from '@datxe/shared';
import { localizedAlert } from '@datxe/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  claimCustomerVoucherCampaign,
  getCustomerVoucherCampaigns,
  getCustomerVouchers,
} from '../api';

export function useCustomerVouchers() {
  const router = useRouter();
  const client = useQueryClient();
  const [claimError, setClaimError] = useState('');
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ['customer', 'getCustomerVouchers'],
    queryFn: getCustomerVouchers,
  });
  const campaignsQuery = useQuery({
    queryKey: ['customer', 'getCustomerVoucherCampaigns'],
    queryFn: getCustomerVoucherCampaigns,
  });
  useRefreshOnFocus(query.refetch);
  useRefreshOnFocus(campaignsQuery.refetch);

  const claimMutation = useMutation({
    mutationFn: (campaignId: number) => claimCustomerVoucherCampaign(campaignId),
    onMutate: campaignId => {
      setClaimingId(campaignId);
      setClaimError('');
    },
    onSuccess: async (claimed) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['customer', 'getCustomerVouchers'] }),
        client.invalidateQueries({ queryKey: ['customer', 'getCustomerVoucherCampaigns'] }),
      ]);
      const info = getVoucherPresentation(claimed);
      localizedAlert(
        i18nT('Đã nhận voucher {0}', { 0: info.title }),
        i18nT('{0} · Đã thêm vào danh sách ưu đãi của bạn.', { 0: info.badge }),
      );
    },
    onError: error => {
      setClaimError(
        error instanceof Error ? error.message : i18nT('Không thể nhận ưu đãi lúc này.'),
      );
    },
    onSettled: () => setClaimingId(null),
  });

  const refresh = async () => {
    await Promise.all([query.refetch(), campaignsQuery.refetch()]);
  };

  return {
    router,
    vouchers: query.data ?? [],
    campaigns: campaignsQuery.data ?? [],
    loading: query.isLoading || campaignsQuery.isLoading,
    error: query.error?.message ?? campaignsQuery.error?.message ?? '',
    claimError,
    claimingId,
    claimCampaign: (campaignId: number) => {
      if (claimingId === null) claimMutation.mutate(campaignId);
    },
    refresh,
  };
}
