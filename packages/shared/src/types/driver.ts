export type DriverProfile = {id:number;avatar_url?:string|null;license_number:string|null;license_class:string|null;years_of_experience:number|null;license_verified:boolean;bank_name?:string|null;bank_account_number?:string|null};
export type DriverVerification = {verification_status:string;verification_workflow:'EKYC'};
export type DriverWallet = {income_balance:number;wallet_transactions:{id:number;ride_id:number|null;type:string;amount:number;balance_after:number|null;description:string|null;created_at:string}[]};
