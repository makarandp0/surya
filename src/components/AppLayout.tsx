import React from 'react';
import { Box, Icon, Button, HStack } from '@chakra-ui/react';
import { LockIcon, AddIcon } from '@chakra-ui/icons';
import { COLORS } from '../constants/colors';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Box
      style={{
        width: 360,
        height: 600,
        background: COLORS.background,
        borderRadius: 8,
        boxShadow: `0 2px 8px ${COLORS.shadow}`,
        overflow: 'hidden',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};

export const AppHeader: React.FC<{
  onLogout?: () => void;
  onAddNew?: () => void;
}> = ({ onLogout, onAddNew }) => {
  return (
    <Box
      style={{
        height: 56,
        background: COLORS.white,
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: onLogout || onAddNew ? 'space-between' : 'center',
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: 1,
        color: COLORS.primary,
        boxShadow: `0 1px 2px ${COLORS.shadowLight}`,
        padding: '0 16px',
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center' }}>
        <Icon as={LockIcon} color="brand.500" boxSize={5} mr={2} /> ChromePass
      </Box>
      {(onLogout || onAddNew) && (
        <HStack spacing={1}>
          {onAddNew && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onAddNew}
              style={{
                fontSize: 12,
                color: COLORS.secondary,
                padding: '4px 8px',
              }}
            >
              <Icon as={AddIcon} boxSize={3} mr={1} /> New
            </Button>
          )}
          {onLogout && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onLogout}
              style={{
                fontSize: 12,
                color: COLORS.secondary,
                padding: '4px 8px',
              }}
            >
              Logout
            </Button>
          )}
        </HStack>
      )}
    </Box>
  );
};

export const AppFooter: React.FC<{ version: string }> = ({ version }) => {
  return (
    <Box
      style={{
        height: 40,
        background: COLORS.white,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: COLORS.secondary,
      }}
    >
      v{version} &nbsp;|&nbsp; <span style={{ color: COLORS.link }}>Help</span>
    </Box>
  );
};
