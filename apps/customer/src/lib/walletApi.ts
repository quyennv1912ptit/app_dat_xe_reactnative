import { createWalletApi } from '@datxe/shared';
import { request } from './api';
export const walletApi = createWalletApi(request, 'customer');
