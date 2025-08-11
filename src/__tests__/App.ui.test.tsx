import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { App } from '../App';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// Mock only derivePassword to avoid heavy PBKDF2 work in UI tests
vi.mock('../crypto', async () => {
  const actual = await vi.importActual<typeof import('../crypto')>('../crypto');
  return {
    ...actual,
    derivePassword: vi.fn(async ({ length }: { length: number }) =>
      'A'.repeat(length || 16),
    ),
  };
});

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

const _queryByText = (
  container: HTMLElement,
  text: string,
): HTMLElement | null => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;
  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    if (el.textContent && el.textContent.trim() === text) {
      return el;
    }
  }
  return null;
};

describe('App UI', () => {
  it('renders headings and fields', () => {
    const { container } = renderApp();
    expect(container.textContent).toContain('ChromePass');
    expect(container.textContent).toContain('Master Key');
    expect(container.textContent).toContain('Site Domain');
    expect(container.textContent).toContain('Generated Password');
    // Generate button present and initially disabled
    const generateBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Generate',
    ) as HTMLButtonElement | undefined;
    expect(generateBtn).toBeTruthy();
    expect(generateBtn!.disabled).toBe(true);
  });

  it('toggles master key visibility with Show/Hide', () => {
    const { container } = renderApp();
    const masterInput = container.querySelector(
      'input[placeholder="Enter master key"]',
    ) as HTMLInputElement;
    expect(masterInput).toBeTruthy();
    expect(masterInput.type).toBe('password');

    const toggleBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Show' || b.textContent === 'Hide',
    ) as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    act(() => {
      toggleBtn.click();
    });
    expect(masterInput.type).toBe('text');

    act(() => {
      toggleBtn.click();
    });
    expect(masterInput.type).toBe('password');
  });

  it('keeps Generate disabled until both fields are filled', async () => {
    const { container } = renderApp();
    const masterInput = container.querySelector(
      'input[placeholder="Enter master key"]',
    ) as HTMLInputElement;
    const generateBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Generate',
    ) as HTMLButtonElement;

    // Initially disabled
    expect(generateBtn.disabled).toBe(true);

    // Enter only master key -> still disabled
    await act(async () => {
      masterInput.value = 'only-master';
      masterInput.dispatchEvent(new Event('input', { bubbles: true }));
      masterInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const generateBtnAfter = Array.from(
      container.querySelectorAll('button'),
    ).find((b) => b.textContent === 'Generate') as HTMLButtonElement;
    expect(generateBtnAfter.disabled).toBe(true);
  });

  it('toggles Include symbols switch', async () => {
    const { container } = renderApp();
    const checkbox = container.querySelector('#symbols') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(false);

    await act(async () => {
      checkbox.click();
    });
    expect(checkbox.checked).toBe(true);

    await act(async () => {
      checkbox.click();
    });
    expect(checkbox.checked).toBe(false);
  });
});
