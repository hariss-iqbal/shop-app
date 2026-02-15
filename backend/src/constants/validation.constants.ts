/**
 * Validation Constants
 * Centralized maxlength and validation constraints for all entities.
 * These values must match the PostgreSQL column constraints and frontend form validators.
 *
 * Referenced by: F-058 (Input Sanitization and XSS Prevention)
 */

export const BRAND_CONSTRAINTS = {
  NAME_MAX: 100
} as const;

export const PRODUCT_CONSTRAINTS = {
  MODEL_MAX: 150,
  DESCRIPTION_MAX: 5000,
  COLOR_MAX: 50,
  IMEI_MAX: 20,
  NOTES_MAX: 2000,
  BATTERY_HEALTH_MIN: 0,
  BATTERY_HEALTH_MAX: 100,
  ACCESSORY_CATEGORY_MAX: 100,
  MATERIAL_MAX: 100,
  DIMENSIONS_MAX: 100,
  WARRANTY_MONTHS_MIN: 0,
  WARRANTY_MONTHS_MAX: 120,
  WEIGHT_GRAMS_MIN: 0,
  WEIGHT_GRAMS_MAX: 100000
} as const;

export const SUPPLIER_CONSTRAINTS = {
  NAME_MAX: 200,
  CONTACT_PERSON_MAX: 200,
  CONTACT_EMAIL_MAX: 255,
  CONTACT_PHONE_MAX: 30,
  ADDRESS_MAX: 1000,
  NOTES_MAX: 2000
} as const;

export const PURCHASE_ORDER_CONSTRAINTS = {
  NOTES_MAX: 2000,
  ITEM_BRAND_MAX: 100,
  ITEM_MODEL_MAX: 150
} as const;

export const SALE_CONSTRAINTS = {
  BUYER_NAME_MAX: 200,
  BUYER_PHONE_MAX: 30,
  BUYER_EMAIL_MAX: 255,
  NOTES_MAX: 2000
} as const;

export const CONTACT_MESSAGE_CONSTRAINTS = {
  NAME_MAX: 200,
  EMAIL_MAX: 255,
  PHONE_MAX: 30,
  SUBJECT_MAX: 300,
  MESSAGE_MAX: 5000
} as const;

export const RECEIPT_CONSTRAINTS = {
  RECEIPT_NUMBER_MAX: 50,
  CUSTOMER_NAME_MAX: 200,
  CUSTOMER_PHONE_MAX: 30,
  CUSTOMER_EMAIL_MAX: 255,
  ITEM_NAME_MAX: 300,
  NOTES_MAX: 2000
} as const;

export const REFUND_CONSTRAINTS = {
  REFUND_NUMBER_MAX: 50,
  REASON_MAX: 500,
  CUSTOMER_NAME_MAX: 200,
  CUSTOMER_PHONE_MAX: 30,
  CUSTOMER_EMAIL_MAX: 255,
  ITEM_NAME_MAX: 300,
  NOTES_MAX: 2000,
  MANAGER_APPROVAL_REASON_MAX: 500,
  MIN_RETURN_PRICE: 0
} as const;

export const RECEIPT_SEQUENCE_CONSTRAINTS = {
  REGISTER_ID_MAX: 50,
  REGISTER_NAME_MAX: 100,
  PREFIX_MAX: 20,
  FORMAT_PATTERN_MAX: 100,
  DATE_FORMAT_MAX: 20,
  SEPARATOR_MAX: 5,
  SEQUENCE_PADDING_MIN: 1,
  SEQUENCE_PADDING_MAX: 10
} as const;

export const CUSTOMER_CONSTRAINTS = {
  PHONE_MAX: 30,
  NAME_MAX: 200,
  EMAIL_MAX: 255,
  NOTES_MAX: 2000
} as const;

export const LOYALTY_CONSTRAINTS = {
  /** Maximum length for transaction description */
  DESCRIPTION_MAX: 500,
  /** Maximum length for adjustment reason */
  REASON_MAX: 500,
  /** Minimum points per dollar rate */
  POINTS_PER_DOLLAR_MIN: 0,
  /** Maximum points per dollar rate */
  POINTS_PER_DOLLAR_MAX: 100,
  /** Minimum redemption rate (dollars per point) */
  REDEMPTION_RATE_MIN: 0.001,
  /** Maximum redemption rate */
  REDEMPTION_RATE_MAX: 1,
  /** Minimum points to redeem */
  MIN_POINTS_TO_REDEEM_MIN: 1,
  /** Maximum points to redeem setting */
  MIN_POINTS_TO_REDEEM_MAX: 10000,
  /** Minimum redemption percent of purchase */
  MAX_REDEMPTION_PERCENT_MIN: 1,
  /** Maximum redemption percent of purchase */
  MAX_REDEMPTION_PERCENT_MAX: 100,
  /** Minimum tier threshold */
  TIER_THRESHOLD_MIN: 1,
  /** Maximum tier threshold */
  TIER_THRESHOLD_MAX: 1000000,
  /** Minimum tier multiplier */
  MULTIPLIER_MIN: 1,
  /** Maximum tier multiplier */
  MULTIPLIER_MAX: 10,
  /** Minimum expiration days (0 = never) */
  EXPIRATION_DAYS_MIN: 0,
  /** Maximum expiration days */
  EXPIRATION_DAYS_MAX: 3650
} as const;

export const COUPON_CONSTRAINTS = {
  /** Maximum length for coupon code */
  CODE_MAX: 50,
  /** Maximum length for coupon description */
  DESCRIPTION_MAX: 500,
  /** Minimum discount value */
  DISCOUNT_VALUE_MIN: 0,
  /** Maximum discount percentage */
  DISCOUNT_PERCENTAGE_MAX: 100,
  /** Maximum fixed discount amount */
  DISCOUNT_AMOUNT_MAX: 1000000,
  /** Minimum purchase amount */
  MIN_PURCHASE_AMOUNT_MIN: 0,
  /** Maximum minimum purchase amount */
  MIN_PURCHASE_AMOUNT_MAX: 1000000,
  /** Maximum discount cap */
  MAX_DISCOUNT_AMOUNT_MIN: 0,
  /** Maximum discount cap */
  MAX_DISCOUNT_AMOUNT_MAX: 1000000,
  /** Minimum redemptions allowed */
  MAX_REDEMPTIONS_MIN: 1,
  /** Maximum redemptions allowed */
  MAX_REDEMPTIONS_MAX: 1000000,
  /** Maximum length for manager approval reason */
  MANAGER_APPROVAL_REASON_MAX: 500
} as const;

export const DISCOUNT_CONFIG_CONSTRAINTS = {
  /** Minimum manager approval threshold percentage */
  MANAGER_APPROVAL_THRESHOLD_MIN: 0,
  /** Maximum manager approval threshold percentage */
  MANAGER_APPROVAL_THRESHOLD_MAX: 100,
  /** Minimum max discount percentage */
  MAX_DISCOUNT_PERCENTAGE_MIN: 0,
  /** Maximum max discount percentage */
  MAX_DISCOUNT_PERCENTAGE_MAX: 100,
  /** Minimum max discount amount */
  MAX_DISCOUNT_AMOUNT_MIN: 0,
  /** Maximum max discount amount */
  MAX_DISCOUNT_AMOUNT_MAX: 1000000
} as const;

export const STORE_LOCATION_CONSTRAINTS = {
  /** Maximum length for location name */
  NAME_MAX: 100,
  /** Maximum length for location code */
  CODE_MAX: 20,
  /** Maximum length for location address */
  ADDRESS_MAX: 1000,
  /** Maximum length for location phone */
  PHONE_MAX: 30,
  /** Maximum length for location email */
  EMAIL_MAX: 255,
  /** Maximum length for location notes */
  NOTES_MAX: 2000
} as const;

export const INVENTORY_TRANSFER_CONSTRAINTS = {
  /** Maximum length for transfer notes */
  NOTES_MAX: 2000,
  /** Maximum length for item notes */
  ITEM_NOTES_MAX: 500,
  /** Minimum quantity for transfer */
  QUANTITY_MIN: 1
} as const;

/**
 * Aggregate map of all text field constraints by entity.
 * Useful for generic sanitization middleware.
 */
export const ALL_TEXT_FIELD_CONSTRAINTS = {
  brand: BRAND_CONSTRAINTS,
  product: PRODUCT_CONSTRAINTS,
  supplier: SUPPLIER_CONSTRAINTS,
  purchaseOrder: PURCHASE_ORDER_CONSTRAINTS,
  sale: SALE_CONSTRAINTS,
  contactMessage: CONTACT_MESSAGE_CONSTRAINTS,
  receipt: RECEIPT_CONSTRAINTS,
  refund: REFUND_CONSTRAINTS,
  receiptSequence: RECEIPT_SEQUENCE_CONSTRAINTS,
  customer: CUSTOMER_CONSTRAINTS,
  loyalty: LOYALTY_CONSTRAINTS,
  coupon: COUPON_CONSTRAINTS,
  discountConfig: DISCOUNT_CONFIG_CONSTRAINTS,
  storeLocation: STORE_LOCATION_CONSTRAINTS,
  inventoryTransfer: INVENTORY_TRANSFER_CONSTRAINTS
} as const;
