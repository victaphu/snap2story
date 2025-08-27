import { randomBytes } from 'crypto';

export const createNanoId = (): string => {
  // Simple nanoid replacement using crypto
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const bytes = randomBytes(21);
  
  for (let i = 0; i < 21; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
};