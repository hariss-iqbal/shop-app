/**
 * Product condition enumeration - stored in database
 */
export enum ProductCondition {
  NEW = 'new',
  USED = 'used',
  OPEN_BOX = 'open_box'
}

export const ProductConditionLabels: Record<ProductCondition, string> = {
  [ProductCondition.NEW]: 'New',
  [ProductCondition.USED]: 'Used',
  [ProductCondition.OPEN_BOX]: 'Open Box'
};
