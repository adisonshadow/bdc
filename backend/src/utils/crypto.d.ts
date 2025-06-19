export function encrypt(text: string): Promise<string>;
export function decrypt(encryptedText: string): Promise<string>;
export function generateRandomPassword(length?: number): string;
export function validatePasswordStrength(password: string): number; 