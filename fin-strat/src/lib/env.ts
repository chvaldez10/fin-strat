export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue!;
}

export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  DATABASE_URL: getEnv("DATABASE_URL", ""),
  JWT_SECRET: getEnv("JWT_SECRET", ""),
  NEXT_PUBLIC_APP_URL: getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
} as const;

