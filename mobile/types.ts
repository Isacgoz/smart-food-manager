// Types mobiles (réexporte depuis /shared + ajouts spécifiques mobile)
export * from '../shared/types';

// Types spécifiques React Native si nécessaire
export interface MobileConfig {
  printerBTName?: string;
  autoLockTimeout?: number;
}
