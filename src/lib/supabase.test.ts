import { describe, it, expect } from 'vitest';
import { createSupabaseClient } from './supabase';

describe('createSupabaseClient', () => {
  it('throws when url is missing', () => {
    expect(() => createSupabaseClient(undefined, 'anon-key')).toThrow(/Missing Supabase/i);
  });

  it('throws when anonKey is missing', () => {
    expect(() => createSupabaseClient('https://x.supabase.co', undefined)).toThrow(/Missing Supabase/i);
  });

  it('throws when both are empty strings', () => {
    expect(() => createSupabaseClient('', '')).toThrow(/Missing Supabase/i);
  });

  it('creates a client exposing auth and from', () => {
    const client = createSupabaseClient('https://x.supabase.co', 'anon-key');
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
