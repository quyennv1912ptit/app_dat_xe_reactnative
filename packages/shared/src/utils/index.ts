export const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
export const formatDate = (value: string | Date) => new Date(value).toLocaleString('vi-VN');
export const formatDistance = (km: number) => `${km.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`;
