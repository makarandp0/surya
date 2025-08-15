# Card Rendering System

This document describes the implementation of the flexible card rendering system that allows switching between different card styles in the Surya application.

## Overview

The system provides two rendering modes for credential cards:

1. **Flip Cards** - The original card design with flip animation to show actions
2. **OpenAI Cards** - A new card design inspired by modern UI patterns

## Architecture

### Core Components

#### 1. `CredentialCardRenderer`

- **Location**: `src/components/CredentialCardRenderer.tsx`
- **Purpose**: Main component that renders either FlipCredentialCard or OpenAICard based on the rendering mode
- **Props**:
  - `secretEntry`: The secret entry data
  - `originalIndex`: Index in the secrets array
  - `masterPassword`: Master password for credential generation
  - `onEdit`: Callback for edit actions
  - `renderingMode`: 'flip' | 'openai' (optional, defaults to 'flip')
  - `onOpenSite`: Callback for opening websites (optional)
  - `compact`: Whether to use compact mode (optional)

#### 2. `OpenAICredentialCardWrapper`

- **Location**: `src/components/OpenAICredentialCardWrapper.tsx`
- **Purpose**: Wrapper component that handles password/TOTP generation for OpenAI cards
- **Features**:
  - On-demand password generation using the same crypto system as flip cards
  - Real-time TOTP code generation and refresh
  - Automatic expiration tracking
  - Integration with the existing credential system

#### 3. `CardRenderingToggle`

- **Location**: `src/components/CardRenderingToggle.tsx`
- **Purpose**: UI control for switching between card rendering modes
- **Features**:
  - Visual toggle with icons for each mode
  - Tooltips showing current mode
  - Clean, accessible interface

### Context System

#### 4. `RenderingPreferencesContext`

- **Location**: `src/contexts/RenderingPreferencesContext.tsx`
- **Types**: `src/contexts/renderingPreferencesTypes.ts`
- **Hook**: `src/hooks/useRenderingPreferences.ts`
- **Purpose**: Global state management for rendering preferences
- **Features**:
  - Persistent card rendering mode selection
  - Provider pattern for clean state management
  - TypeScript support with proper types

## Usage

### Basic Usage

```tsx
import { CredentialCardRenderer } from './CredentialCardRenderer';
import { useRenderingPreferences } from '../hooks/useRenderingPreferences';

const MyComponent = () => {
  const { cardRenderingMode } = useRenderingPreferences();

  return (
    <CredentialCardRenderer
      secretEntry={secret}
      originalIndex={index}
      masterPassword={masterPassword}
      onEdit={handleEdit}
      renderingMode={cardRenderingMode}
    />
  );
};
```

## Integration Points

### 1. UnifiedSection Integration

The `UnifiedSection` component has been updated to:

- Use `CredentialCardRenderer` instead of direct `FlipCredentialCard`
- Include the `CardRenderingToggle` in the UI
- Respect the current rendering mode preference
- Pass appropriate props for both card types

### 2. Crypto System Integration

Both card types use the same underlying crypto system:

- `derivePassword()` for deterministic password generation
- `generateTOTP()` for time-based one-time passwords
- `normalizeDomainFromUrl()` for domain extraction

### 3. Main Application Integration

- Provider is set up in `main.tsx`
- Context is available throughout the app
- Preference state is managed globally

## Card Types Comparison

| Feature             | Flip Cards                          | OpenAI Cards                           |
| ------------------- | ----------------------------------- | -------------------------------------- |
| Password Display    | Hidden by default, revealed on flip | Hidden by default, generated on demand |
| TOTP Display        | Shown on flip with timer            | Real-time with circular progress       |
| Actions             | Flip animation to show controls     | Always visible action buttons          |
| Visual Style        | Card-like with flip effect          | Modern, clean design with avatars      |
| Information Density | Lower (requires flip)               | Higher (more info visible)             |
| Performance         | Lighter (less real-time updates)    | Slightly heavier (TOTP refresh)        |

## Testing

A demo component `CardRenderingDemo` is available for testing:

- Shows sample credentials in both rendering modes
- Includes toggle functionality
- Demonstrates password and TOTP generation
- Available by setting `useCardDemo = true` in `App.tsx`

## Future Enhancements

1. **Persistence**: Save user's rendering preference to localStorage
2. **More Card Types**: Add additional card designs
3. **Customization**: Allow per-card rendering mode overrides
4. **Animation**: Smooth transitions when switching modes
5. **Responsive Design**: Optimize for different screen sizes
6. **Accessibility**: Enhanced keyboard navigation and screen reader support

## File Structure

```
src/
├── components/
│   ├── CredentialCardRenderer.tsx
│   ├── OpenAICredentialCardWrapper.tsx
│   ├── CardRenderingToggle.tsx
│   ├── CardRenderingDemo.tsx
│   ├── FlipCredentialCard.tsx (existing)
│   └── OpenAiCard.tsx (existing)
├── contexts/
│   ├── RenderingPreferencesContext.tsx
│   └── renderingPreferencesTypes.ts
└── hooks/
    └── useRenderingPreferences.ts
```
