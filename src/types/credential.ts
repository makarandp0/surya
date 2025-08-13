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

export interface UnifiedSectionProps {
  masterPassword: string;
  secrets: SecretEntry[];
  onLogout: () => void;
  onEditSecret: (index: number) => void;
}
