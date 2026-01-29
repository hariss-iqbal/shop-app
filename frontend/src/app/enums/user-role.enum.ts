/**
 * User role enumeration - frontend only
 * Maps to Supabase Auth roles for RLS
 */
export enum UserRole {
  ANON = 'anon',
  AUTHENTICATED = 'authenticated'
}
