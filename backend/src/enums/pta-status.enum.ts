/**
 * PTA (Pakistan Telecommunication Authority) Status
 */
export enum PtaStatus {
  PTA_APPROVED = 'pta_approved',
  NON_PTA = 'non_pta'
}

export const PtaStatusLabels: Record<PtaStatus, string> = {
  [PtaStatus.PTA_APPROVED]: 'PTA Approved',
  [PtaStatus.NON_PTA]: 'Non PTA'
};

export function isValidPtaStatus(value: string): value is PtaStatus {
  return Object.values(PtaStatus).includes(value as PtaStatus);
}

export function getPtaStatusLabel(status: PtaStatus): string {
  return PtaStatusLabels[status];
}
