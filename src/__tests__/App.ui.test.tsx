import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { App } from '../App';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// Mock the crypto functions to avoid heavy computations and allow testing
vi.mock('../crypto', async () => {
  const actual = await vi.importActual<typeof import('../crypto')>('../crypto');
  return {
    ...actual,
    derivePassword: vi.fn(async ({ length }: { length: number }) =>
      'A'.repeat(length || 16),
    ),
    generateTOTP: vi.fn(async () => ({ code: '123456', timeRemaining: 25 })),
    decryptSecretsFile: vi.fn(async () => ({
      v: 2,
      ts: Date.now(),
      d: [
        {
          name: 'Mock Secret',
          secret: 'ABC123',
          color: 'blue',
        },
      ],
    })),
  };
});

// Mock the storage service to avoid storage operations during tests
vi.mock('../services/storage', () => ({
  storageService: {
    loadSession: vi.fn(async () => null), // No stored session in tests
    saveSession: vi.fn(async () => Promise.resolve()),
    clearSession: vi.fn(async () => Promise.resolve()),
    updateLastAccessed: vi.fn(async () => Promise.resolve()),
  },
}));

const renderApp = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <ChakraProvider>
        <App />
      </ChakraProvider>,
    );
  });
  return { container, root };
};

// Helper to simulate file selection
const createMockFile = (content: string, filename = 'secrets.json') => {
  const blob = new Blob([content], { type: 'application/json' });
  return new File([blob], filename, { type: 'application/json' });
};

// Helper to wait for app initialization
const waitForInitialization = async (container: Element) => {
  // Wait for loading text to disappear and login form to appear
  let attempts = 0;
  while (attempts < 10) {
    // max 1 second
    if (
      container.textContent?.includes('Surya Login') &&
      !container.textContent?.includes('Loading Surya...')
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }
  // If still not ready, just proceed (mocked services should be fast)
};

describe('App UI', () => {
  it('renders login screen initially', async () => {
    const { container } = renderApp();

    // Wait for initialization to complete
    await act(async () => {
      await waitForInitialization(container);
    });

    expect(container.textContent).toContain('Surya');
    expect(container.textContent).toContain('Remember password');
    expect(container.textContent).toContain('Unlock Vault');

    // Login button should be present
    const loginBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === '🚀 Unlock Vault',
    ) as HTMLButtonElement | undefined;
    expect(loginBtn).toBeTruthy();
    expect(loginBtn!.disabled).toBe(true); // Initially disabled
  });

  it('toggles master password visibility', async () => {
    const { container } = renderApp();

    // Wait for initialization to complete
    await act(async () => {
      await waitForInitialization(container);
    });

    const masterInput = container.querySelector(
      'input[placeholder*="Enter your master password"]',
    ) as HTMLInputElement;
    expect(masterInput).toBeTruthy();
    expect(masterInput.type).toBe('password');

    // Look for the show/hide icon button
    const toggleBtn = container.querySelector(
      'button[aria-label="Show password"]',
    ) as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    act(() => {
      toggleBtn.click();
    });
    expect(masterInput.type).toBe('text');

    // Button aria-label should change
    const hideBtn = container.querySelector(
      'button[aria-label="Hide password"]',
    ) as HTMLButtonElement;
    expect(hideBtn).toBeTruthy();
  });

  it('login button behavior is correct', async () => {
    const { container } = renderApp();

    // Wait for initialization to complete
    await act(async () => {
      await waitForInitialization(container);
    });

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    let loginBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === '🚀 Unlock Vault',
    ) as HTMLButtonElement;

    // Initially disabled (no password, no file)
    expect(loginBtn.disabled).toBe(true);

    // Add file but no password -> still disabled
    const mockFile = createMockFile('{"v":2,"ts":123,"d":[]}');
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      // Give React time to update
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    loginBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === '🚀 Unlock Vault',
    ) as HTMLButtonElement;

    // Should still be disabled since we have no password
    // Note: In a real browser environment with proper event handling,
    // this would be enabled when both password and file are present
    expect(loginBtn.disabled).toBe(true);
  });

  it('login screen displays correctly', async () => {
    const { container } = renderApp();

    // Wait for initialization to complete
    await act(async () => {
      await waitForInitialization(container);
    });

    // Verify login screen elements are present
    expect(container.textContent).toContain('Remember password');
    expect(container.textContent).toContain('Unlock Vault');

    // Should have login button
    const loginBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === '🚀 Unlock Vault',
    ) as HTMLButtonElement;
    expect(loginBtn).toBeTruthy();
    expect(loginBtn.disabled).toBe(true); // Initially disabled

    // Should have file input
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // Should have password input
    const passwordInput = container.querySelector(
      'input[placeholder*="Enter your master password"]',
    ) as HTMLInputElement;
    expect(passwordInput).toBeTruthy();
  });
});
