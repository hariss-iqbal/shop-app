/**
 * Validation Constants
 * Centralized maxlength and validation constraints for all entities.
 * These values match the backend validation and PostgreSQL column constraints.
 *
 * Referenced by: F-058 (Input Sanitization and XSS Prevention)
 */

export const BRAND_CONSTRAINTS = {
  NAME_MAX: 100
} as const;

export const PHONE_CONSTRAINTS = {
  MODEL_MAX: 150,
  DESCRIPTION_MAX: 5000,
  COLOR_MAX: 50,
  IMEI_MAX: 20,
  NOTES_MAX: 2000,
  BATTERY_HEALTH_MIN: 0,
  BATTERY_HEALTH_MAX: 100
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
