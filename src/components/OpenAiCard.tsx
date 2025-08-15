import * as React from 'react';
import { useState } from 'react';
import {
  ChakraProvider,
  extendTheme,
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
  Kbd,
  SimpleGrid,
  Box,
  useClipboard,
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
  tags?: string[];
  lastUpdatedAt?: Date;
  password?: string;
  initiallyRevealed?: boolean;
  onRequestPassword?: () => Promise<string> | string;
  totpCode?: string;
  totpPeriodSec?: number;
  totpExpiresAfterSeconds?: number;
  onOpenSite?: (urlOrDomain: string) => void;
  onEdit?: (id: string) => void;
  compact?: boolean;
};

/*********************** Card ************************/
export const OpenAICredentialCard: React.FC<OpenAICredCardProps> = (props) => {
  const {
    id,
    website,
    username,
    name,
    tags,
    lastUpdatedAt,
    password,
    initiallyRevealed,
    onRequestPassword,
    totpCode,
    totpExpiresAfterSeconds,
    totpPeriodSec,
    onOpenSite,
    onEdit,
    compact,
  } = props;

  const title = name || getDomain(website) || 'Credential';

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
      <CardHeader py={compact ? 3 : 4}>
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

        <HStack mt={2} spacing={3} flexWrap="wrap" minW={0} w="full">
          {username && (
            <HStack spacing={2} minW={0} flex={1}>
              <Text color="gray.500" flexShrink={0}>
                User:
              </Text>
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
            </HStack>
          )}
          <Spacer />
          {tags?.length ? (
            <HStack spacing={1} flexWrap="wrap" flexShrink={0}>
              {tags.map((t) => (
                <Badge key={t} colorScheme="purple" variant="subtle">
                  {t}
                </Badge>
              ))}
            </HStack>
          ) : null}
        </HStack>
      </CardHeader>

      {(password || totpCode) && <Divider />}

      <CardBody py={compact ? 3 : 4}>
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
                No secrets stored. Generate on demand or add 2FA.
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>

      <CardFooter py={compact ? 2 : 3}>
        <HStack w="full" color="gray.500" fontSize="xs" minW={0}>
          <Text
            noOfLines={1}
            title={title}
            minW={0}
            flex={1}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {title}
          </Text>
          <Spacer />
          {lastUpdatedAt && (
            <HStack flexShrink={0} spacing={1}>
              <TimeIcon boxSize="12px" />
              <Text>updated {lastUpdatedAt.toLocaleDateString()}</Text>
            </HStack>
          )}
          {totpPeriodSec && totpCode && (
            <HStack flexShrink={0} spacing={1}>
              <Text>·</Text>
              <Text>
                <Kbd>{totpPeriodSec}s</Kbd> TOTP
              </Text>
            </HStack>
          )}
        </HStack>
      </CardFooter>
    </Card>
  );
};

/*********************** Gallery ************************/
const CredentialGalleryInner: React.FC = () => {
  const items = [
    {
      id: '1',
      website: 'https://github.com',
      username: 'maka@example.com',
      name: 'GitHub',
      password: 'S3cr3t!…',
      totpCode: '123456',
      totpExpiresAtMs: Date.now() + 12_000,
      tags: ['work', 'dev'],
      lastUpdatedAt: new Date(),
    },
    {
      id: '2',
      website: 'gmail.com',
      username: 'maka@example.com',
      name: 'Gmail',
      onRequestPassword: async () => {
        // Replace with Surya deterministic generator
        return 'generated-by-surya';
      },
      tags: ['personal'],
      lastUpdatedAt: new Date(Date.now() - 86_400_000),
    },
    {
      id: '3',
      website: 'totp-only.app',
      name: 'TOTP Only',
      totpCode: '987654',
      totpExpiresAtMs: Date.now() + 25_000,
      totpPeriodSec: 30,
    },
    {
      id: '4',
      website: 'https://example.com',
      name: 'Metadata-only',
      username: 'me@example.com',
      tags: ['misc'],
    },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Project Surya – Chakra v2 Credential Cards
          </Text>
          <Text color="gray.500" fontSize="sm">
            Interactive mock: reveal/copy password, copy TOTP, open site, and
            see the countdown.
          </Text>
        </Box>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
          {items.map((props) => (
            <OpenAICredentialCard
              key={props.id}
              {...props}
              compact
              onOpenSite={(u) =>
                window.open(u.startsWith('http') ? u : `https://${u}`, '_blank')
              }
              // eslint-disable-next-line no-console
              onEdit={(id) => console.log('edit', id)}
            />
          ))}
        </SimpleGrid>

        <Box pt={4}>
          <Text fontSize="lg" fontWeight="medium" mb={2}>
            Dark Surface Variant (vault look)
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
            <Box bg="gray.900" p={3} borderRadius="2xl">
              <OpenAICredentialCard
                id="5"
                website="cloudflare.com"
                name="Cloudflare"
                username="ops@surya.dev"
                tags={['infra', 'prod']}
                password="••••••••"
                totpCode="493201"
                totpExpiresAfterSeconds={20}
              />
            </Box>
            <Box bg="gray.900" p={3} borderRadius="2xl">
              <OpenAICredentialCard
                id="6"
                website="stripe.com"
                name="Stripe"
                username="billing@surya.dev"
                tags={['billing']}
                password="••••••••"
              />
            </Box>
            <Box bg="gray.900" p={3} borderRadius="2xl">
              <OpenAICredentialCard
                id="7"
                website="slack.com"
                name="Slack"
                username="team@surya.dev"
                tags={['comms']}
                totpCode="220911"
                totpExpiresAfterSeconds={15}
              />
            </Box>
          </SimpleGrid>
        </Box>
      </VStack>
    </Box>
  );
};

/*********************** App Wrapper ************************/
const theme = extendTheme({
  config: { initialColorMode: 'light', useSystemColorMode: false },
});

export const Temp = () => {
  return (
    <ChakraProvider theme={theme}>
      <CredentialGalleryInner />
    </ChakraProvider>
  );
};
