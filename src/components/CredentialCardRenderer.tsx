import React from 'react';
import { SecretEntry } from '../crypto';
import { FlipCredentialCard } from './FlipCredentialCard';
import { OpenAICredentialCardWrapper } from './OpenAICredentialCardWrapper';
import { type CardRenderingMode } from '../contexts/renderingPreferencesTypes';

interface CredentialCardRendererProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
  onEdit: (index: number) => void;
  renderingMode?: CardRenderingMode;
  // Additional props for OpenAI card
  onOpenSite?: (urlOrDomain: string) => void;
  compact?: boolean;
}

export const CredentialCardRenderer: React.FC<CredentialCardRendererProps> = ({
  secretEntry,
  originalIndex,
  masterPassword,
  onEdit,
  renderingMode = 'flip',
  onOpenSite,
  compact = false,
}) => {
  if (renderingMode === 'openai') {
    return (
      <OpenAICredentialCardWrapper
        secretEntry={secretEntry}
        originalIndex={originalIndex}
        masterPassword={masterPassword}
        onEdit={onEdit}
        onOpenSite={onOpenSite}
        compact={compact}
      />
    );
  }

  // Default to flip card
  return (
    <FlipCredentialCard
      secretEntry={secretEntry}
      originalIndex={originalIndex}
      masterPassword={masterPassword}
      onEdit={onEdit}
    />
  );
};
