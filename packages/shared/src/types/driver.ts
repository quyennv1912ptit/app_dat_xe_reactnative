// Backend V42 đã bỏ luồng giấy tờ thủ công: GET /driver/profile chỉ trả các field dưới đây.
// license_image_url / license_review_status không còn được trả về.
export type DriverProfile = {id:number;avatar_url?:string|null;license_number:string|null;license_class:string|null;years_of_experience:number|null;license_verified:boolean;bank_name?:string|null;bank_account_number?:string|null};
export type DriverDocument = {id:number;document_type:string;document_number:string|null;secure_url:string;public_id:string;verification_status:'PENDING'|'APPROVED'|'REJECTED';rejection_reason:string|null;expires_at:string|null;is_current:boolean};
export type DriverSkill = {id:number;vehicle_type:'CAR'|'MOTORCYCLE';transmission:'AUTO'|'MANUAL';license_class:string|null;verified:boolean};
// DriverVerificationSummary (backend) chỉ có verification_status + verification_workflow.
// Các field luồng cũ là optional: tuyệt đối không đọc trực tiếp `.length` khi chưa kiểm tra.
export type DriverVerification = {verification_status:string;verification_workflow?:'EKYC'|null;required_document_types?:string[];missing_documents?:string[];unverified_skills?:DriverSkill[]};
export type DriverWallet = {income_balance:number;wallet_transactions:{id:number;ride_id:number|null;type:string;amount:number;balance_after:number|null;description:string|null;created_at:string}[]};
