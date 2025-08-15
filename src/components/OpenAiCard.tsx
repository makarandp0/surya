import * as React from 'react';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Text,
  Badge,
  Avatar,
  IconButton,
  Code,
  CircularProgress,
  CircularProgressLabel,
  Spacer,
  Divider,
  Box,
  useClipboard,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  CopyIcon,
  CheckIcon,
  ViewIcon,
  ViewOffIcon,
  EditIcon,
  ExternalLinkIcon,
  LockIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import { FiUser } from 'react-icons/fi';

/*********************** Utilities ************************/
const getDomain = (input?: string): string | undefined => {
  if (!input) {
    return undefined;
  }
  try {
    const u = input.includes('://')
      ? new URL(input)
      : new URL(`https://${input}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return input;
  }
};

const getFaviconUrl = (website?: string) => {
  const domain = getDomain(website);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : undefined;
};

/*********************** Subcomponents ************************/
const TitleLine: React.FC<{ website?: string; name?: string }> = ({
  website,
  name,
}) => {
  const domain = getDomain(website);
  const label = name || domain || 'Credential';
  const favicon = getFaviconUrl(website);
  return (
    <HStack spacing={3} align="center" minW={0} flex={1}>
      <Avatar size="sm" src={favicon} name={domain || 'site'} flexShrink={0} />
      <Badge
        colorScheme="gray"
        variant="subtle"
        noOfLines={1}
        maxW="180px"
        overflow="hidden"
        textOverflow="ellipsis"
        title={domain}
        flexShrink={0}
      >
        {label}
      </Badge>
    </HStack>
  );
};

const UserField: React.FC<{
  username: string;
}> = ({ username }) => {
  const { onCopy, hasCopied } = useClipboard(username);
  const handleCopy = async () => {
    onCopy();
  };

  const subtleFg = useColorModeValue('gray.600', 'gray.400');

  return (
    <HStack w="full" spacing={2}>
      <Box as={FiUser} boxSize={4} color={subtleFg} />
      <Code
        noOfLines={1}
        minW={0}
        flex={1}
        overflow="hidden"
        textOverflow="ellipsis"
        title={username}
      >
        {username}
      </Code>

      <IconButton
        aria-label="Copy userName"
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        size="sm"
        variant="ghost"
        onClick={handleCopy}
      />
    </HStack>
  );
};

const PasswordField: React.FC<{
  passwordProp?: string;
  initiallyRevealed?: boolean;
  onRequestPassword?: () => Promise<string> | string;
}> = ({ passwordProp, initiallyRevealed, onRequestPassword }) => {
  const [revealed, setRevealed] = useState<boolean>(!!initiallyRevealed);
  const [password, setPassword] = useState<string | undefined>(passwordProp);
  const { onCopy, hasCopied, setValue } = useClipboard(password || '');

  const ensurePassword = async () => {
    if (password || !onRequestPassword) {
      return;
    }
    const got = await onRequestPassword();
    setPassword(got);
    setValue(got);
  };

  const handleReveal = async () => {
    await ensurePassword();
    setRevealed((r) => !r);
  };

  const handleCopy = async () => {
    await ensurePassword();
    onCopy();
  };

  if (!passwordProp && !onRequestPassword) {
    return null;
  }

  return (
    <HStack w="full" spacing={2}>
      <LockIcon boxSize="14px" />
      <Box
        as={Code}
        flex="1"
        fontFamily="mono"
        overflow="hidden"
        px={2}
        py={1}
        borderRadius="md"
      >
        {revealed ? password ?? '••••••••••' : '••••••••••'}
      </Box>
      <IconButton
        aria-label={revealed ? 'Hide password' : 'Reveal password'}
        icon={revealed ? <ViewOffIcon /> : <ViewIcon />}
        size="sm"
        variant="ghost"
        onClick={handleReveal}
      />
      <IconButton
        aria-label="Copy password"
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        size="sm"
        variant="ghost"
        onClick={handleCopy}
      />
    </HStack>
  );
};

const TotpBlock: React.FC<{
  totpCode?: string;
  totpPeriodSec?: number;
  totpExpiresAfterSeconds?: number;
}> = ({ totpCode, totpPeriodSec = 30, totpExpiresAfterSeconds }) => {
  const secondsRemaining = totpExpiresAfterSeconds || 0;
  const progress = (secondsRemaining / totpPeriodSec) * 100;
  const { onCopy, hasCopied } = useClipboard(totpCode || '');
  if (!totpCode) {
    return null;
  }

  return (
    <HStack w="full" spacing={3}>
      <CircularProgress
        value={progress}
        size="34px"
        color={secondsRemaining <= 5 ? 'red.500' : 'green.500'}
      >
        <CircularProgressLabel fontSize="xs">
          {totpExpiresAfterSeconds ?? '–'}
        </CircularProgressLabel>
      </CircularProgress>
      <Text
        fontFamily="mono"
        fontSize="lg"
        letterSpacing="widest"
        userSelect="text"
      >
        {totpCode}
      </Text>
      <Spacer />
      <IconButton
        aria-label="Copy TOTP"
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        size="sm"
        variant="ghost"
        onClick={onCopy}
      />
    </HStack>
  );
};

export type OpenAICredCardProps = {
  id: string;
  website?: string;
  username?: string;
  name?: string;
  lastUpdatedAt?: Date;
  password?: string;
  initiallyRevealed?: boolean;
  onRequestPassword?: () => Promise<string> | string;
  totpCode?: string;
  totpPeriodSec?: number;
  totpExpiresAfterSeconds?: number;
  onOpenSite?: (urlOrDomain: string) => void;
  onEdit?: (id: string) => void;
};

/*********************** Card ************************/
export const OpenAICredentialCard: React.FC<OpenAICredCardProps> = (props) => {
  const {
    id,
    website,
    username,
    name,
    lastUpdatedAt,
    password,
    initiallyRevealed,
    onRequestPassword,
    totpCode,
    totpExpiresAfterSeconds,
    totpPeriodSec,
    onOpenSite,
    onEdit,
  } = props;

  return (
    <Card
      variant="outline"
      size="sm"
      borderRadius="2xl"
      shadow="sm"
      _hover={{ shadow: 'md' }}
      w="full"
      maxW="100%"
    >
      <CardHeader py={3}>
        <HStack align="start" spacing={3} w="full" minW={0}>
          <TitleLine website={website} name={name} />
          <Spacer />
          <HStack spacing={1} flexShrink={0}>
            {website && (
              <IconButton
                aria-label="Open site"
                icon={<ExternalLinkIcon />}
                size="sm"
                variant="ghost"
                onClick={() => onOpenSite?.(website)}
              />
            )}
            <IconButton
              aria-label="Edit entry"
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              onClick={() => onEdit?.(id)}
            />
          </HStack>
        </HStack>

        {username && <UserField username={username} />}
      </CardHeader>

      {(password || totpCode) && <Divider />}

      <CardBody py={3}>
        <VStack align="stretch" spacing={3}>
          <PasswordField
            passwordProp={password}
            initiallyRevealed={initiallyRevealed}
            onRequestPassword={onRequestPassword}
          />

          <TotpBlock
            totpCode={totpCode}
            totpPeriodSec={totpPeriodSec}
            totpExpiresAfterSeconds={totpExpiresAfterSeconds}
          />

          {!password && !totpCode && (
            <HStack color="gray.500">
              <LockIcon boxSize="14px" />
              <Text fontSize="sm">
                No secrets stored! Generate on demand or add 2FA.
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>

      <CardFooter py={2}>
        <HStack w="full" color="gray.500" fontSize="xs" minW={0}>
          <Spacer />
          {lastUpdatedAt && (
            <HStack flexShrink={0} spacing={1}>
              <TimeIcon boxSize="12px" />
              <Text>updated {lastUpdatedAt.toLocaleDateString()}</Text>
            </HStack>
          )}
        </HStack>
      </CardFooter>
    </Card>
  );
};
