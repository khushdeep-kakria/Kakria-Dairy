/**
 * Environment Variable Validation for Kakria Dairy
 * Fail-fast validation ensuring critical secrets and configuration exist.
 */

interface EnvConfig {
  MONGODB_URI: string;
  JWT_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_PASSWORD?: string;
  UPI_ID: string;
  PAYEE_NAME: string;
  UNCLE_WHATSAPP: string;
  PORT?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
}

const REQUIRED_ENV_VARS: (keyof EnvConfig)[] = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'UPI_ID',
  'PAYEE_NAME',
  'UNCLE_WHATSAPP',
];

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar] || process.env[envVar]!.trim() === '') {
      missing.push(envVar);
    }
  }

  // Ensure either ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is set
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    missing.push('ADMIN_PASSWORD_HASH or ADMIN_PASSWORD');
  }

  if (missing.length > 0) {
    const errorMsg =
      `\n=======================================================\n` +
      `[CRITICAL CONFIG ERROR] Missing required environment variables:\n` +
      missing.map((v) => `  - ${v}`).join('\n') +
      `\nPlease define them in your .env file or environment.\n` +
      `=======================================================\n`;
    console.error(errorMsg);
    return { valid: false, missing };
  }

  return { valid: true, missing: [] };
}

// Auto-run validation once on server-side load
if (typeof window === 'undefined') {
  const check = validateEnv();
  if (!check.valid && process.env.NODE_ENV === 'production') {
    console.warn(`[Env Validation] Server starting with missing env vars: ${check.missing.join(', ')}`);
  }
}
