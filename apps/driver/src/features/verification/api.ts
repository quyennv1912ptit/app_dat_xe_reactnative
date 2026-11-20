import { getAuth } from '@react-native-firebase/auth';
import { fetch } from 'expo/fetch';
import { env } from '@/config/env';
import { authenticatedTransport, VerificationError, verificationOrigin } from './transport';
import type {
  Extraction,
  QrCardVariant,
  QrCrossValidationStatus,
  QrDocumentSide,
  QrDocumentType,
  QrExtractionResult,
  QrSource,
  QrStatus,
  SlotKey,
} from './workflow';

export type {
  QrCardVariant,
  QrCrossValidationStatus,
  QrDocumentSide,
  QrDocumentType,
  QrExtractionResult,
  QrSource,
  QrStatus,
};

export type VerificationWarning = {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'BLOCKING';
  documentType: string | null;
  slot: string | null;
  fieldKey: string | null;
  humanReadableMessage: string;
  recommendedAction: string;
  evidenceSource: string;
  documentRevision: number;
  requiresReview: boolean;
  blocksSubmission: boolean;
  blocksActivation: boolean;
};

export type LockedIdentity = {
  maskedCccdId?: string | null;
  fullName?: string | null;
  dob?: string | null;
  verifiedGplxNumber?: string | null;
};

export type EligibilityStatus = {
  hasActiveApproval: boolean;
  canReceiveRides: boolean;
  approvedGroupIds: string[];
  activeEnabledGroupIds: string[];
  restrictionReason?: string | null;
};

export type VerificationHistoryEntry = {
  revision: number;
  role: string;
  action: string;
  at: string;
  metadata?: { reason?: string | null; codes?: string[]; changedFields?: string[] } | null;
};

export interface Application {
  verificationWarnings?: VerificationWarning[];
  id: string;
  status: string;
  revision: number;
  submissionRevision?: number | null;
  approvedRevision?: number | null;
  approvedSubmissionRevision?: number | null;
  identityLocked?: boolean;
  lockedIdentity?: LockedIdentity | null;
  identityHold?: boolean;
  identityHoldReason?: string | null;
  eligibilityStatus?: EligibilityStatus | null;
  reason?: string | null;
  requestedChanges?: { captures: SlotKey[]; fields: string[] } | null;
  approvedDocument?: {
    confirmed?: Record<string, unknown>;
    captures?: Partial<Record<SlotKey, { id: string; mime: string }>>;
  } | null;
  document?: {
    confirmed?: Record<string, unknown>;
    captures: Partial<Record<SlotKey, { id: string; mime: string }>>;
    proposals?: Partial<Record<SlotKey, { captureId?: string; result?: Extraction }>>;
    confirmationCurrent?: boolean;
    qrLiveScan?: QrExtractionResult | null;
    gplxQrLiveScan?: QrExtractionResult | null;
  };
  history?: VerificationHistoryEntry[];
}

const backendOrigin = env.apiUrl.replace(/\/api\/?$/, '');
export const verificationUrl =
  verificationOrigin(backendOrigin, __DEV__);

export function verificationClient(expectedUid: string) {
  if (!verificationUrl) throw new VerificationError('SERVER');
  return authenticatedTransport(verificationUrl, async refresh => {
    const user = getAuth().currentUser;
    if (!user || user.uid !== expectedUid) throw new VerificationError('UNAUTHORIZED');
    let token: string;
    try { token = await user.getIdToken(refresh); }
    catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code && ['auth/user-token-expired', 'auth/invalid-user-token', 'auth/user-disabled'].includes(code)) {
        throw new VerificationError('UNAUTHORIZED');
      }
      throw error;
    }
    if (!token || getAuth().currentUser?.uid !== expectedUid) throw new VerificationError('UNAUTHORIZED');
    return token;
  }, fetch);
}

export type ProposalResponse = Application & { proposal: Extraction };
export type QrScanResponse = Application & { qr: QrExtractionResult };
export const jsonBody = (value: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
});
