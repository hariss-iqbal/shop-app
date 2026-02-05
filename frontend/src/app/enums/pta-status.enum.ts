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

export const PtaStatusSeverity: Record<PtaStatus, string> = {
  [PtaStatus.PTA_APPROVED]: 'success',
  [PtaStatus.NON_PTA]: 'warn'
};

export const PtaStatusIcons: Record<PtaStatus, string> = {
  [PtaStatus.PTA_APPROVED]: 'pi pi-verified',
  [PtaStatus.NON_PTA]: 'pi pi-exclamation-triangle'
};
