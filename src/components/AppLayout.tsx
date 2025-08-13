import React from 'react';
import { Box, Icon, Button, HStack } from '@chakra-ui/react';
import { LockIcon, AddIcon, ChevronLeftIcon } from '@chakra-ui/icons';
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
  currentView?: 'main' | 'edit' | 'new';
  isLoggedIn?: boolean;
  onLogout?: () => void;
  onAddNew?: () => void;
  onBack?: () => void;
}> = ({
  currentView = 'main',
  isLoggedIn = false,
  onLogout,
  onAddNew,
  onBack,
}) => {
  const getHeaderTitle = () => {
    if (currentView === 'edit') {
      return 'Edit Entry';
    }
    if (currentView === 'new') {
      return 'New Entry';
    }
    return 'Surya';
  };

  const showBackButton = currentView !== 'main' && onBack;
  const showAddButton = currentView === 'main' && onAddNew;
  const showLogoutButton = isLoggedIn && currentView === 'main' && onLogout;

  return (
    <Box
      style={{
        height: 56,
        background: COLORS.white,
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          showBackButton || showAddButton || showLogoutButton
            ? 'space-between'
            : 'center',
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: 1,
        color: COLORS.primary,
        boxShadow: `0 1px 2px ${COLORS.shadowLight}`,
        padding: '0 16px',
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center' }}>
        {showBackButton && (
          <Button
            size="xs"
            variant="ghost"
            onClick={onBack}
            style={{
              fontSize: 12,
              color: COLORS.secondary,
              padding: '4px 8px',
              marginRight: '8px',
            }}
          >
            <ChevronLeftIcon boxSize={4} mr={1} /> Back
          </Button>
        )}
        {currentView === 'main' && (
          <Icon as={LockIcon} color="brand.500" boxSize={5} mr={2} />
        )}
        {getHeaderTitle()}
      </Box>

      {(showAddButton || showLogoutButton) && (
        <HStack spacing={1}>
          {showAddButton && (
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
          {showLogoutButton && (
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
