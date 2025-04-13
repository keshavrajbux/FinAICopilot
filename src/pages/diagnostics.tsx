import React, { useEffect, useState } from 'react';
import {
  Box, Container, Heading, Text, VStack, Divider, Alert, 
  AlertIcon, Button, Link, List, ListItem, ListIcon,
  useColorModeValue, Code, SimpleGrid, Center
} from '@chakra-ui/react';
import { CheckCircleIcon, InfoIcon, LockIcon } from '@chakra-ui/icons';
import DatabaseTester from '@/components/DatabaseTester';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

const DiagnosticsPage: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only allow access in development mode or with the proper query parameter
    const isDev = process.env.NODE_ENV === 'development';
    const hasDevMode = router.query.devMode === 'true';
    setIsAuthorized(isDev || hasDevMode);
    setIsLoading(false);
  }, [router.query]);

  if (isLoading) {
    return (
      <Center height="100vh">
        <Text>Loading...</Text>
      </Center>
    );
  }

  if (!isAuthorized) {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Container maxW="container.md" py={10} textAlign="center">
          <LockIcon boxSize={16} color="red.500" mb={6} />
          <Heading size="xl" mb={4}>Access Restricted</Heading>
          <Text fontSize="lg" mb={8}>
            This diagnostics page is only available to developers.
          </Text>
          <Button as={NextLink} href="/" colorScheme="purple" size="lg">
            Return to Application
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={6}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading 
              size="xl" 
              bgGradient="linear(to-r, purple.400, purple.600)" 
              bgClip="text"
              mb={2}
            >
              Financial Decision Copilot - Diagnostics
            </Heading>
            <Text color={textColor} fontSize="lg">
              Troubleshoot and diagnose issues with your application setup
            </Text>
          </Box>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>
              This page helps identify and resolve common issues with the Financial Decision Copilot. 
              Use the tools below to diagnose problems with your database connection or API setup.
            </Text>
          </Alert>

          <Box>
            <Heading size="md" mb={4}>Database Diagnostics</Heading>
            <DatabaseTester />
          </Box>

          <Divider />

          <Box>
            <Heading size="md" mb={4}>Common Issues & Solutions</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
                <Heading size="sm" mb={3}>Database Configuration Issues</Heading>
                <List spacing={2}>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span" fontWeight="bold">Missing Environment Variables:</Text>
                    <Text mt={1}>
                      Ensure you have all required environment variables in your .env.local file.
                      Check the .env.example file for reference.
                    </Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span" fontWeight="bold">Missing Database Tables:</Text>
                    <Text mt={1}>
                      Run the setup script to create required database tables:
                      <Code mt={2} p={2} display="block">node setup-database.js</Code>
                    </Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span" fontWeight="bold">Row Level Security (RLS) Issues:</Text>
                    <Text mt={1}>
                      If data saving fails with permission errors, check RLS policies on your tables.
                      The demo user "demo-user-123" should have access.
                    </Text>
                  </ListItem>
                </List>
              </Box>

              <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
                <Heading size="sm" mb={3}>API Configuration Issues</Heading>
                <List spacing={2}>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span" fontWeight="bold">Missing AI API Keys:</Text>
                    <Text mt={1}>
                      For AI analysis, you need either an Anthropic API key (Claude) or an OpenAI API key.
                      Check AI-CONFIG-README.md for details.
                    </Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span" fontWeight="bold">API Errors:</Text>
                    <Text mt={1}>
                      Check browser console (F12) for API error details. Most common issues are
                      missing API keys or rate limiting.
                    </Text>
                  </ListItem>
                </List>
              </Box>

              <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
                <Heading size="sm" mb={3}>Client-Side Fallbacks</Heading>
                <Text mb={3}>
                  The app includes multiple fallback mechanisms to ensure functionality even if
                  some components fail:
                </Text>
                <List spacing={2}>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    <Text as="span">Local calculation fallback if AI analysis fails</Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    <Text as="span">OpenAI fallback if Claude API fails</Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    <Text as="span">Analysis without persistence if database fails</Text>
                  </ListItem>
                </List>
              </Box>

              <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
                <Heading size="sm" mb={3}>Browser Console Tips</Heading>
                <Text mb={3}>
                  The app includes detailed logging in the browser console (F12) to help diagnose issues:
                </Text>
                <List spacing={2}>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span">Look for "Error in saving financial data" messages</Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span">Check for "API Fallback" or "Client Fallback" logs</Text>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={InfoIcon} color="blue.500" />
                    <Text as="span">Examine network requests to /api/analyze-finances</Text>
                  </ListItem>
                </List>
              </Box>
            </SimpleGrid>
          </Box>

          <Box textAlign="center" mt={6}>
            <Button as={NextLink} href="/" colorScheme="purple" size="lg">
              Return to Application
            </Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default DiagnosticsPage;