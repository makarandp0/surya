import { COLORS } from './colors';

export const SHARED_INPUT_STYLES = {
  fontSize: 'sm',
  h: 8,
  borderRadius: 'md',
  borderColor: COLORS.border,
  _hover: {
    borderColor: COLORS.secondary,
  },
  _focus: {
    borderColor: COLORS.link,
    boxShadow: `0 0 0 1px ${COLORS.link}`,
  },
  _placeholder: {
    color: COLORS.secondary,
    fontSize: 'sm',
  },
} as const;

export const FORM_LABEL_STYLES = {
  fontSize: 'sm',
  fontWeight: '600',
  color: COLORS.primary,
  textTransform: 'none' as const,
  letterSpacing: '0.01em',
  mb: 1,
} as const;

export const ACCORDION_BUTTON_STYLES = {
  px: 0,
  py: 2,
  borderBottom: `1px solid ${COLORS.border}`,
  _hover: { bg: 'gray.50' },
  _expanded: { bg: 'white' },
} as const;

export const ACCORDION_HEADER_TEXT = {
  fontSize: 'sm',
  fontWeight: '600',
  color: COLORS.primary,
  letterSpacing: '0.01em',
} as const;

export const ACCORDION_PANEL_STYLES = {
  px: 0,
  pt: 3,
  pb: 4,
} as const;
