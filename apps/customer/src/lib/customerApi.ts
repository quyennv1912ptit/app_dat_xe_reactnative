import { createCustomerApi } from '@datxe/shared';
import { request } from './api';
export const customerApi = createCustomerApi(request);
