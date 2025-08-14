import React, { createContext } from 'react';
import { SecretEntry } from '../crypto';

// Types
export interface AppState {
  // Authentication state
  isLoggedIn: boolean;
  masterPassword: string;

  // Secrets management
  secrets: SecretEntry[];
  originalSecrets: SecretEntry[]; // For tracking dirty state

  // Navigation state
  currentView: 'main' | 'edit' | 'new';
  editingSecretIndex: number;

  // Edit state
  currentEditData: SecretEntry | null;
  isDirty: boolean;

  // UI state
  showDeleteModal: boolean;
  initError: string | null;
  isInitializing: boolean;
  autoLoginAttempted: boolean;
}

export type AppAction =
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_INIT_ERROR'; payload: string | null }
  | { type: 'SET_AUTO_LOGIN_ATTEMPTED'; payload: boolean }
  | { type: 'LOGIN'; payload: { password: string; secrets: SecretEntry[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_SECRETS'; payload: SecretEntry[] }
  | { type: 'ADD_SECRET'; payload: SecretEntry }
  | { type: 'UPDATE_SECRET'; payload: { index: number; secret: SecretEntry } }
  | { type: 'DELETE_SECRET'; payload: number }
  | { type: 'SET_CURRENT_VIEW'; payload: 'main' | 'edit' | 'new' }
  | { type: 'SET_EDITING_SECRET_INDEX'; payload: number }
  | { type: 'SET_CURRENT_EDIT_DATA'; payload: SecretEntry | null }
  | { type: 'SET_SHOW_DELETE_MODAL'; payload: boolean }
  | { type: 'START_EDIT'; payload: number }
  | { type: 'START_NEW' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SAVE_CURRENT_EDIT' }
  | { type: 'DELETE_CURRENT_EDIT' };

// Context
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);
