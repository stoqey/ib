import os from 'os';
const { env } = process;

// Envs
export const isDev = env.NODE_ENV !== 'production';

export const isTest = env.NODE_ENV === 'test';

export const forceLog = env.FORCE_LOG || false;

if (isDev) {
    require('dotenv').config();
}

export const IB_PORT: number = +(env.IB_PORT || 7496);
export const IB_HOST: string = env.IB_HOST || '127.0.0.1';

// Live account ids for live trading
export const LIVE_ACCOUNT_IDS: string = env.LIVE_ACCOUNT_IDS || '';

