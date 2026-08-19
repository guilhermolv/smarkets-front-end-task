import { describe, expect, it } from 'vitest';
import { errorMessageFor } from './smarketsClient';

describe('errorMessageFor', () => {
  it('uses login copy only for auth requests', () => {
    expect(errorMessageFor(undefined, 'auth')).toBe('Unable to log in to Smarkets right now.');
    expect(errorMessageFor(undefined, 'data')).toBe('Unable to load Smarkets data right now.');
    expect(errorMessageFor('INVALID_CREDENTIALS', 'data')).toBe('The username or password was not accepted by Smarkets.');
  });
});
