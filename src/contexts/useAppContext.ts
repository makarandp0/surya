import { useContext, useMemo } from 'react';
import { AppContext } from './AppTypes';
import { SecretEntry } from '../crypto';

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Action creators for commonly used patterns
export const useAppActions = () => {
  const { dispatch } = useAppContext();

  return useMemo(
    () => ({
      // Authentication actions
      login: (password: string, secrets: SecretEntry[]) =>
        dispatch({ type: 'LOGIN', payload: { password, secrets } }),
      logout: () => dispatch({ type: 'LOGOUT' }),

      // Initialization actions
      setInitializing: (value: boolean) =>
        dispatch({ type: 'SET_INITIALIZING', payload: value }),
      setInitError: (error: string | null) =>
        dispatch({ type: 'SET_INIT_ERROR', payload: error }),
      setAutoLoginAttempted: (value: boolean) =>
        dispatch({ type: 'SET_AUTO_LOGIN_ATTEMPTED', payload: value }),

      // Secret management actions
      setSecrets: (secrets: SecretEntry[]) =>
        dispatch({ type: 'SET_SECRETS', payload: secrets }),
      addSecret: (secret: SecretEntry) =>
        dispatch({ type: 'ADD_SECRET', payload: secret }),
      updateSecret: (index: number, secret: SecretEntry) =>
        dispatch({ type: 'UPDATE_SECRET', payload: { index, secret } }),
      deleteSecret: (index: number) =>
        dispatch({ type: 'DELETE_SECRET', payload: index }),

      // Navigation actions
      startEdit: (index: number) =>
        dispatch({ type: 'START_EDIT', payload: index }),
      startNew: () => dispatch({ type: 'START_NEW' }),
      cancelEdit: () => dispatch({ type: 'CANCEL_EDIT' }),

      // Edit form actions
      setCurrentEditData: (data: SecretEntry | null) =>
        dispatch({ type: 'SET_CURRENT_EDIT_DATA', payload: data }),
      saveCurrentEdit: () => dispatch({ type: 'SAVE_CURRENT_EDIT' }),
      deleteCurrentEdit: () => dispatch({ type: 'DELETE_CURRENT_EDIT' }),

      // UI actions
      setShowDeleteModal: (show: boolean) =>
        dispatch({ type: 'SET_SHOW_DELETE_MODAL', payload: show }),
    }),
    [dispatch],
  );
};
