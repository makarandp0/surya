import { SecretEntry } from '../crypto';

export interface CredentialCard {
  secretEntry: SecretEntry;
  domain: string;
  username: string;
  password: string;
  totpCode?: string;
  totpTimeRemaining?: number;
  originalIndex: number;
}
