import { translate as i18nT } from '@datxe/shared';
import type { CustomerProfile, CustomerProfileUpdate } from '@datxe/shared';
export type ProfileDraft={name:string;email:string;birthDate:string;gender:string};
export function profileUpdate(draft:ProfileDraft, latest:CustomerProfile):CustomerProfileUpdate {
 const name=draft.name.trim(),email=draft.email.trim(),date=draft.birthDate.trim();
 if(!name || name.length>255)throw new Error(i18nT("Họ và tên phải có từ 1 đến 255 ký tự."));
 if(email && (email.length>255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new Error(i18nT("Email không đúng định dạng."));
 if(date){const [y,m,d]=date.split('-').map(Number);const parsed=new Date(y,m-1,d);const today=new Date();today.setHours(0,0,0,0);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||parsed.getFullYear()!==y||parsed.getMonth()!==m-1||parsed.getDate()!==d||parsed>=today)throw new Error(i18nT("Ngày sinh cần đúng định dạng YYYY-MM-DD và nằm trong quá khứ."));}
 if(draft.gender&&!['MALE','FEMALE','OTHER'].includes(draft.gender))throw new Error(i18nT("Giới tính không hợp lệ."));
 return {full_name:name,email:email||null,date_of_birth:date||null,gender:draft.gender||null,default_payment_method:latest.default_payment_method};
}
export function cashPaymentUpdate(latest:CustomerProfile):CustomerProfileUpdate {
 if(!latest.full_name?.trim())throw new Error(i18nT("Vui lòng cập nhật họ và tên trong thông tin cá nhân trước."));
 return {full_name:latest.full_name,email:latest.email,date_of_birth:latest.date_of_birth,gender:latest.gender,default_payment_method:'CASH'};
}
