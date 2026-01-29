/**
 * Phone status enumeration - stored in database
 */
export enum PhoneStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved'
}

export const PhoneStatusLabels: Record<PhoneStatus, string> = {
  [PhoneStatus.AVAILABLE]: 'Available',
  [PhoneStatus.SOLD]: 'Sold',
  [PhoneStatus.RESERVED]: 'Reserved'
};

export const PhoneStatusColors: Record<PhoneStatus, string> = {
  [PhoneStatus.AVAILABLE]: 'success',
  [PhoneStatus.SOLD]: 'danger',
  [PhoneStatus.RESERVED]: 'warning'
};
