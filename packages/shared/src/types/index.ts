export type CustomerProfile = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  default_payment_method: PaymentMethod | null;
  avatar_url: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | string;
};

export type PaymentMethod = 'CASH' | 'WALLET' | 'VNPAY' | 'MOMO';

export type CustomerProfileUpdate = {
  full_name: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  default_payment_method: PaymentMethod | null;
};

export type RideStatus =
  | 'PENDING'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'VEHICLE_HANDOVER'
  | 'IN_PROGRESS'
  | 'ARRIVED_DESTINATION'
  | 'VEHICLE_RETURNED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED_SYSTEM'
  | 'NO_DRIVER_FOUND'
  | 'EXPIRED';

export * from './support';
export type RideActorRole = 'CUSTOMER' | 'DRIVER' | 'SYSTEM';
export type RideStatusResponse = {
  rideId: number;
  previousStatus: RideStatus;
  currentStatus: RideStatus;
  changedAt: string;
};

export type CustomerRideDriver = {
  id: number;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  averageRating: number | null;
  yearsOfExperience?: number | null;
  licenseClass?: string | null;
  licenseVerified?: boolean;
  profileVerified?: boolean;
};

export type CustomerRideDetail = {
  driverHasRatedCustomer?: boolean | null;
  customerHasRatedDriver?: boolean | null;
  paymentMethod?: PaymentMethod | null;
  driverEarnings?: { netAmount: number; commissionAmount: number; creditedToCash: boolean; paid: boolean } | null;
  payment?: { amount: number; method: PaymentMethod; status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'; paidAt: string | null } | null;
  pickupNote?: string | null;
  route?: SavedRideRoute | null;
  id: number;
  customerId: number;
  customer?: {
    fullName: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    averageRating?: number | null;
  } | null;
  driverId: number | null;
  driver?: CustomerRideDriver | null;
  vehicleId: number;
  vehicleType?: 'CAR' | 'MOTORCYCLE' | null;
  transmission?: 'AUTO' | 'MANUAL' | null;
  vehicleSnapshot?: {
    brand?: string | null;
    model?: string | null;
    color?: string | null;
  } | null;
  licensePlate?: string | null;
  type: 'INSTANT' | 'SCHEDULED';
  scheduledAt: string | null;
  pickupAddress: string | null;
  pickup: { lat: number | null; lng: number | null };
  dropoffAddress: string | null;
  dropoff: { lat: number | null; lng: number | null };
  distanceKm: number | null;
  estimatedFare: number;
  finalFare: number | null;
  payableFare?: number;
  driverExpectedEarning?: number;
  hasRated?: boolean;
  myRatingStars?: number | null;
  myRatingComment?: string | null;
  status: RideStatus;
  cancelReason: string | null;
  cancelledBy: number | null;
  statusHistory: Array<{
    id: number;
    fromStatus: RideStatus | null;
    toStatus: RideStatus;
    actorId: number | null;
    note: string | null;
    createdAt: string;
    actorRole: RideActorRole | null;
  }>;
  handoverReports: Array<{
    revision?: number;
    correctionReason?: string | null;
    correctionImages?: Array<{ fileUrl: string; publicId: string }>;
    id: number;
    phase: 'PICKUP' | 'DROPOFF';
    odometer: number;
    fuelLevel: number | null;
    notes: string | null;
    confirmedByCustomer: boolean;
    photos: Array<{
      id: number;
      angle: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'DASHBOARD';
      fileUrl: string;
      createdAt: string;
    }>;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledByRole: RideActorRole | null;
  discountAmount: number | null;
  unreadChatCount: number;
};

export type CustomerRidePage = {
  content: CustomerRideSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type CustomerRideSummary = {
  vehicleType?: 'CAR' | 'MOTORCYCLE' | null;
  id: number;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  type: 'INSTANT' | 'SCHEDULED';
  status: RideStatus;
  estimatedFare: number;
  finalFare: number | null;
  discountAmount?: number;
  payableFare?: number;
  scheduledAt: string | null;
  createdAt: string;
  hasRated?: boolean;
  myRatingStars?: number | null;
};

export type RideCoordinates = { lat: number; lng: number };
export type MapDirections = {
  distance: number;
  duration: number;
  coordinates: RideCoordinates[];
  steps?: Array<{ instruction: string; distanceMeters: number }>;
};

export type SavedRideRoute = { id: string; polyline: string; polylinePrecision: number; coordinates: RideCoordinates[]; distanceMeters: number; durationSeconds: number; provider: string; vehicleType: 'CAR' | 'MOTORCYCLE'; limitation?: string | null; expiresAt?: string | null };
export type NearbyDriverMarker = { location: RideCoordinates };
export type RideEstimateRequest = {
  routeQuoteId?: string | null;
  vehicleId: number;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  scheduledAt?: string | null;
  paymentMethod?: PaymentMethod;
  voucher_code?: string | null;
  voucher_id?: number | null;
};
export type RideEstimate = {
  route?: SavedRideRoute | null;
  pricingRuleId: number;
  distanceKm: number;
  estimatedDurationMinutes: number;
  baseFare: number;
  distanceFare: number;
  waitingFare: number;
  nightSurcharge: number;
  returnFee: number;
  estimatedFare: number;
  discountAmount: number;
  payableFare: number;
};
export type CreateCustomerRideRequest = RideEstimateRequest & {
  pickupNote?: string | null;
  type: 'INSTANT' | 'SCHEDULED';
  paymentMethod: PaymentMethod;
  note?: string | null;
};
export type CreateCustomerRideResponse = {
  route?: SavedRideRoute | null;
  id: number;
  status: RideStatus;
  estimatedFare: number;
  discountAmount: number;
  payableFare: number;
  createdAt: string;
};
export type CustomerNotification = {
  id: number;
  messageId: string;
  type: string;
  payload: unknown;
  createdAt: string;
  readAt: string | null;
};

export type VehicleSpecifications = {
  engineType?: 'COMBUSTION' | 'ELECTRIC' | 'HYBRID' | null;
  electricMotorKw?: number | null;
  passengerSeats?: number | null;
  designedMassKg?: number | null;
  trailerMassKg?: number | null;
};

export type CustomerVehicleCreate = {
  plate_number: string;
  transmission_type: 'MANUAL' | 'AUTO';
  vehicle_type: 'CAR' | 'MOTORCYCLE';
  engine_cc: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  specifications?: VehicleSpecifications;
};

export type CustomerVehicle = {
  id: number;
  plate_number: string | null;
  transmission_type: string | null;
  vehicle_type: string | null;
  engine_cc: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  images: Array<{ id: number; secure_url: string }>;
  is_default?: boolean;
  specifications?: VehicleSpecifications | null;
  specification_source?: 'CUSTOMER_DECLARED';
};

export type CustomerVoucher = {
  id: number;
  code: string | null;
  campaignCode?: string | null;
  campaignTitle?: string | null;
  description?: string | null;
  milestone?: number;
  claimSequence?: number | null;
  campaignClaimLimit?: number | null;
  discountType: string;
  value: number;
  maxDiscount: number | null;
  minimumOrderAmount: number;
  usageCount: number;
  usageLimit: number | null;
  validFrom: string;
  validTo: string;
  source?: string;
};

export type CustomerVoucherCampaign = {
  id: number;
  code: string;
  campaignTitle?: string | null;
  description: string;
  discountType: string;
  value: number;
  maxDiscount: number | null;
  minimumOrderAmount: number;
  claimedCount: number;
  claimLimit: number;
  validFrom: string;
  validTo: string;
  budgetLimit: number;
  budgetRemaining: number;
};

export type CustomerChatMessage = {
  id: number;
  clientMessageId: string | null;
  senderRole: 'CUSTOMER' | 'DRIVER';
  messageType: 'TEXT' | 'IMAGE';
  content: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  readAt: string | null;
};

export type CustomerChatPage = {
  rideId: number;
  messages: CustomerChatMessage[];
  hasMore: boolean;
};

export type CustomerChatSendRequest = {
  clientMessageId: string;
  messageType?: 'TEXT' | 'IMAGE';
  content?: string | null;
  attachmentUrl?: string | null;
  attachmentPublicId?: string | null;
};

export type CustomerChatPageOptions = {
  beforeId?: number;
  afterId?: number;
  size?: number;
};


export type CustomerImageFile = { uri: string; fileName?: string | null; mimeType?: string | null };
export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';
export type Ride = CustomerRideDetail;
