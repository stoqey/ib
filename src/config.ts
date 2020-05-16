require('dotenv').config();
const { env } = process;

// Envs
export const isDev = env.NODE_ENV !== 'production';
export const forceLog = env.FORCE_LOG || false;
export const IB_PORT: number = +(env.IB_PORT || 7496);
export const IB_HOST: string = env.IB_HOST || '127.0.0.1';
