import React from 'react';
import { SecretEntry } from '../crypto';
import { OpenAICredentialCardWrapper } from './OpenAICredentialCardWrapper';

interface CredentialCardRendererProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
  onEdit: (index: number) => void;
  // Additional props for OpenAI card
  onOpenSite?: (urlOrDomain: string) => void;
}

export const CredentialCardRenderer: React.FC<CredentialCardRendererProps> = ({
  secretEntry,
  originalIndex,
  masterPassword,
  onEdit,
  onOpenSite,
}) => {
  return (
    <OpenAICredentialCardWrapper
      secretEntry={secretEntry}
      originalIndex={originalIndex}
      masterPassword={masterPassword}
      onEdit={onEdit}
      onOpenSite={onOpenSite}
    />
  );
};
