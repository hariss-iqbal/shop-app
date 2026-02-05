/**
 * Phone condition enumeration - stored in database
 */
export enum PhoneCondition {
  NEW = 'new',
  USED = 'used',
  OPEN_BOX = 'open_box'
}

export const PhoneConditionLabels: Record<PhoneCondition, string> = {
  [PhoneCondition.NEW]: 'New',
  [PhoneCondition.USED]: 'Used',
  [PhoneCondition.OPEN_BOX]: 'Open Box'
};
