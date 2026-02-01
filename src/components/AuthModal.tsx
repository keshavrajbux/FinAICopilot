import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '@/lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const toast = useToast();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
    } else {
      toast({
        title: 'Welcome back!',
        status: 'success',
        duration: 3000,
      });
      onClose();
      resetForm();
    }

    setIsLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccessMessage('Check your email for a confirmation link!');
      toast({
        title: 'Account created!',
        description: 'Check your email for a confirmation link.',
        status: 'success',
        duration: 5000,
      });
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent mx={4}>
        <ModalHeader textAlign="center" pt={6}>
          Welcome to FinAI Copilot
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs isFitted variant="enclosed" onChange={() => setError(null)}>
            <TabList mb={4}>
              <Tab>Sign In</Tab>
              <Tab>Sign Up</Tab>
            </TabList>

            <TabPanels>
              {/* Sign In Panel */}
              <TabPanel px={0}>
                <VStack spacing={4}>
                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    colorScheme="purple"
                    width="100%"
                    onClick={handleSignIn}
                    isLoading={isLoading}
                  >
                    Sign In
                  </Button>
                </VStack>
              </TabPanel>

              {/* Sign Up Panel */}
              <TabPanel px={0}>
                <VStack spacing={4}>
                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  {successMessage && (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      {successMessage}
                    </Alert>
                  )}

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    colorScheme="purple"
                    width="100%"
                    onClick={handleSignUp}
                    isLoading={isLoading}
                  >
                    Create Account
                  </Button>

                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    By signing up, you agree to our terms of service.
                  </Text>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
