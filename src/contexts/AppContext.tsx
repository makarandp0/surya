import React, { useReducer, ReactNode } from 'react';
import { SecretEntry } from '../crypto';
import { AppState, AppAction } from './AppTypes';
import { AppContext } from './AppTypes';

const initialState: AppState = {
  isLoggedIn: false,
  masterPassword: '',
  secrets: [],
  originalSecrets: [],
  currentView: 'main',
  editingSecretIndex: -1,
  currentEditData: null,
  isDirty: false,
  showDeleteModal: false,
  initError: null,
  isInitializing: true,
  autoLoginAttempted: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload };

    case 'SET_INIT_ERROR':
      return { ...state, initError: action.payload };

    case 'SET_AUTO_LOGIN_ATTEMPTED':
      return { ...state, autoLoginAttempted: action.payload };

    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        masterPassword: action.payload.password,
        secrets: action.payload.secrets,
        originalSecrets: [...action.payload.secrets], // Deep copy for dirty tracking
        isDirty: false,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isInitializing: false,
        autoLoginAttempted: state.autoLoginAttempted,
      };

    case 'SET_SECRETS':
      return {
        ...state,
        secrets: action.payload,
        originalSecrets: [...action.payload],
        isDirty: false,
      };

    case 'ADD_SECRET': {
      const newSecrets = [...state.secrets, action.payload];
      return {
        ...state,
        secrets: newSecrets,
        isDirty: !arraysEqual(newSecrets, state.originalSecrets),
      };
    }

    case 'UPDATE_SECRET': {
      const updatedSecrets = [...state.secrets];
      updatedSecrets[action.payload.index] = action.payload.secret;
      return {
        ...state,
        secrets: updatedSecrets,
        isDirty: !arraysEqual(updatedSecrets, state.originalSecrets),
      };
    }

    case 'DELETE_SECRET': {
      const filteredSecrets = state.secrets.filter(
        (_, i) => i !== action.payload,
      );
      return {
        ...state,
        secrets: filteredSecrets,
        isDirty: !arraysEqual(filteredSecrets, state.originalSecrets),
      };
    }

    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };

    case 'SET_EDITING_SECRET_INDEX':
      return { ...state, editingSecretIndex: action.payload };

    case 'SET_CURRENT_EDIT_DATA':
      return { ...state, currentEditData: action.payload };

    case 'SET_SHOW_DELETE_MODAL':
      return { ...state, showDeleteModal: action.payload };

    case 'START_EDIT':
      return {
        ...state,
        currentView: 'edit',
        editingSecretIndex: action.payload,
        currentEditData: null,
      };

    case 'START_NEW':
      return {
        ...state,
        currentView: 'new',
        editingSecretIndex: -1,
        currentEditData: null,
      };

    case 'CANCEL_EDIT':
      return {
        ...state,
        currentView: 'main',
        editingSecretIndex: -1,
        currentEditData: null,
      };

    case 'SAVE_CURRENT_EDIT': {
      if (!state.currentEditData) {
        return state;
      }

      if (state.editingSecretIndex === -1) {
        // Adding new secret
        const newSecretsWithAdd = [...state.secrets, state.currentEditData];
        return {
          ...state,
          secrets: newSecretsWithAdd,
          isDirty: !arraysEqual(newSecretsWithAdd, state.originalSecrets),
          currentView: 'main',
          editingSecretIndex: -1,
          currentEditData: null,
        };
      } else {
        // Updating existing secret
        const updatedSecretsWithSave = [...state.secrets];
        updatedSecretsWithSave[state.editingSecretIndex] =
          state.currentEditData;
        return {
          ...state,
          secrets: updatedSecretsWithSave,
          isDirty: !arraysEqual(updatedSecretsWithSave, state.originalSecrets),
          currentView: 'main',
          editingSecretIndex: -1,
          currentEditData: null,
        };
      }
    }

    case 'DELETE_CURRENT_EDIT': {
      if (state.editingSecretIndex === -1) {
        return state;
      }

      const deletedSecrets = state.secrets.filter(
        (_, i) => i !== state.editingSecretIndex,
      );
      return {
        ...state,
        secrets: deletedSecrets,
        isDirty: !arraysEqual(deletedSecrets, state.originalSecrets),
        currentView: 'main',
        editingSecretIndex: -1,
        currentEditData: null,
        showDeleteModal: false,
      };
    }

    default:
      return state;
  }
};

// Helper function to compare arrays for dirty state detection
const arraysEqual = (a: SecretEntry[], b: SecretEntry[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    const entryA = a[i];
    const entryB = b[i];

    if (
      entryA.name !== entryB.name ||
      entryA.secret !== entryB.secret ||
      entryA.website !== entryB.website ||
      entryA.username !== entryB.username ||
      entryA.passwordLength !== entryB.passwordLength ||
      entryA.includeSymbols !== entryB.includeSymbols ||
      entryA.color !== entryB.color
    ) {
      return false;
    }
  }

  return true;
};

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
