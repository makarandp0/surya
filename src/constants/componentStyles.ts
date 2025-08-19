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
    fontSize: 'xs',
  },
} as const;

export const FORM_LABEL_STYLES = {
  fontSize: 'xs',
  fontWeight: '600',
  color: COLORS.primary,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  mb: 1,
} as const;
