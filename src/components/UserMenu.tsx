import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  HStack,
  Text,
  Spinner,
  useDisclosure,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';
import AuthModal from './AuthModal';

export default function UserMenu() {
  const { user, loading, isConfigured, signOut } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (loading) {
    return <Spinner size="sm" color="purple.500" />;
  }

  // If Supabase is not configured, show demo mode badge
  if (!isConfigured) {
    return (
      <Tooltip
        label="Set up Supabase to enable user accounts"
        placement="bottom"
        hasArrow
      >
        <Badge colorScheme="orange" variant="subtle" px={3} py={1}>
          Demo Mode
        </Badge>
      </Tooltip>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          colorScheme="purple"
          variant="outline"
          size="sm"
          onClick={onOpen}
          leftIcon={<FaUser />}
        >
          Sign In
        </Button>
        <AuthModal isOpen={isOpen} onClose={onClose} />
      </>
    );
  }

  // User is logged in
  const displayEmail = user.email || 'User';

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        rightIcon={<ChevronDownIcon />}
      >
        <HStack spacing={2}>
          <Avatar size="xs" name={displayEmail} bg="purple.500" />
          <Text fontSize="sm" display={{ base: 'none', md: 'block' }}>
            {displayEmail.length > 20 ? displayEmail.slice(0, 20) + '...' : displayEmail}
          </Text>
        </HStack>
      </MenuButton>
      <MenuList>
        <MenuItem isDisabled>
          <Text fontSize="sm" color="gray.500">
            Signed in as {displayEmail}
          </Text>
        </MenuItem>
        <MenuDivider />
        <MenuItem icon={<FaSignOutAlt />} onClick={signOut}>
          Sign Out
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
