import { Provider, InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SupabaseClient');

export function provideSupabase(): Provider[] {
  return [
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(
        environment.supabase.url,
        environment.supabase.anonKey
      )
    }
  ];
}
