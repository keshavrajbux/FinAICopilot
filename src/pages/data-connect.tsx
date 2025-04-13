import React, { useState } from 'react';
import {
  Box, Container, Heading, Text, VStack, Divider, 
  Button, useColorModeValue, SimpleGrid, Card, CardBody,
  Flex, Icon, Switch, FormControl, FormLabel, Badge,
  IconButton, Tooltip, Input, InputGroup, InputRightElement,
  Alert, AlertIcon, useToast
} from '@chakra-ui/react';
import { 
  FaEnvelope, FaCreditCard, FaBell, FaFileInvoiceDollar, 
  FaLock, FaCheckCircle, FaExternalLinkAlt, FaArrowLeft,
  FaUniversity, FaQuestion, FaShieldAlt
} from 'react-icons/fa';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

// Interface for data source
interface DataSource {
  id: string;
  name: string;
  type: 'email' | 'bank' | 'notification' | 'invoice' | 'other';
  icon: React.ElementType;
  description: string;
  connected: boolean;
  authRequired: boolean;
  dataPoints: string[];
}

const DataConnectPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const bgColor = useColorModeValue('purple.50', 'gray.900');
  const textColor = useColorModeValue('purple.800', 'purple.100');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('purple.500', 'purple.300');
  
  // State for data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'email-gmail',
      name: 'Gmail',
      type: 'email',
      icon: FaEnvelope,
      description: 'Connect your Gmail to analyze financial emails, receipts, and bills',
      connected: false,
      authRequired: true,
      dataPoints: ['Purchase receipts', 'Subscription notifications', 'Bill reminders', 'Financial alerts']
    },
    {
      id: 'email-outlook',
      name: 'Outlook',
      type: 'email',
      icon: FaEnvelope,
      description: 'Connect your Outlook to analyze financial emails, receipts, and bills',
      connected: false,
      authRequired: true,
      dataPoints: ['Purchase receipts', 'Subscription notifications', 'Bill reminders', 'Financial alerts']
    },
    {
      id: 'bank-plaid',
      name: 'Bank Accounts (via Plaid)',
      type: 'bank',
      icon: FaUniversity,
      description: 'Securely connect your bank accounts to track transactions and balances',
      connected: false,
      authRequired: true,
      dataPoints: ['Account balances', 'Transaction history', 'Spending categories', 'Income sources']
    },
    {
      id: 'notification-mobile',
      name: 'Mobile Notifications',
      type: 'notification',
      icon: FaBell,
      description: 'Analyze your payment and financial app notifications',
      connected: false,
      authRequired: true,
      dataPoints: ['Payment alerts', 'Balance updates', 'Unusual activity', 'Budget alerts']
    },
    {
      id: 'invoice-scan',
      name: 'Invoice Scanner',
      type: 'invoice',
      icon: FaFileInvoiceDollar,
      description: 'Upload or scan invoices and receipts for expense tracking',
      connected: true,
      authRequired: false,
      dataPoints: ['Purchase amounts', 'Vendor information', 'Date of purchase', 'Expense categories']
    },
    {
      id: 'credit-cards',
      name: 'Credit Card Statements',
      type: 'bank',
      icon: FaCreditCard,
      description: 'Connect your credit card accounts to track expenses and detect subscriptions',
      connected: false,
      authRequired: true,
      dataPoints: ['Monthly statements', 'Recurring charges', 'Interest rates', 'Payment due dates']
    }
  ]);
  
  // State for connection in progress
  const [connecting, setConnecting] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  
  // Handle connection toggle
  const handleConnect = (id: string) => {
    const source = dataSources.find(s => s.id === id);
    if (!source) return;
    
    if (source.connected) {
      // Disconnect logic
      setDataSources(sources => 
        sources.map(s => s.id === id ? {...s, connected: false} : s)
      );
      toast({
        title: "Disconnected",
        description: `${source.name} has been disconnected.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } else if (source.authRequired) {
      // Start auth flow
      setConnecting(id);
    } else {
      // Connect without auth
      setDataSources(sources => 
        sources.map(s => s.id === id ? {...s, connected: true} : s)
      );
      toast({
        title: "Connected",
        description: `${source.name} has been connected successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Complete auth flow
  const completeAuth = () => {
    if (!connecting) return;
    
    const source = dataSources.find(s => s.id === connecting);
    if (!source) return;
    
    setDataSources(sources => 
      sources.map(s => s.id === connecting ? {...s, connected: true} : s)
    );
    
    toast({
      title: "Connected",
      description: `${source.name} has been connected successfully. We'll now analyze your data.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    setConnecting(null);
    setAuthEmail('');
  };
  
  // Cancel auth flow
  const cancelAuth = () => {
    setConnecting(null);
    setAuthEmail('');
  };
  
  // Group data sources by type
  const groupedSources = {
    email: dataSources.filter(s => s.type === 'email'),
    financial: dataSources.filter(s => s.type === 'bank'),
    notifications: dataSources.filter(s => s.type === 'notification'),
    documents: dataSources.filter(s => s.type === 'invoice' || s.type === 'other')
  };
  
  return (
    <Box 
      minH="100vh" 
      bg={bgColor}
      position="relative"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"%23E9D8FD\" opacity=\"0.1\"><text x=\"50\" y=\"50\" font-family=\"Arial\" font-size=\"60\" text-anchor=\"middle\" dominant-baseline=\"middle\">$</text></svg>')",
        backgroundRepeat: "repeat",
        backgroundSize: "100px",
        opacity: 0.1,
        zIndex: 0
      }}
    >
      <Container maxW="container.xl" py={6} position="relative" zIndex={1}>
        {/* Header with back button */}
        <Flex justify="space-between" align="center" mb={6}>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="ghost"
            onClick={() => router.push('/')}
            size="md"
          >
            Back to Dashboard
          </Button>
          
          <Heading
            size="lg"
            bgGradient="linear(to-r, purple.400, purple.600)"
            bgClip="text"
            textAlign="center"
            letterSpacing="tight"
          >
            finAI agent <Text as="span" fontSize="xl">$$$</Text>
          </Heading>
        </Flex>
        
        {connecting ? (
          // Authentication View
          <VStack spacing={8} align="stretch">
            <Flex align="center">
              <IconButton
                aria-label="Go back"
                icon={<FaArrowLeft />}
                variant="ghost"
                onClick={cancelAuth}
                mr={4}
              />
              <Heading size="lg" color={accentColor}>
                Connect to {dataSources.find(s => s.id === connecting)?.name}
              </Heading>
            </Flex>
            
            <Card bg={cardBgColor} shadow="md" borderRadius="lg">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center" p={4}>
                    <Icon 
                      as={dataSources.find(s => s.id === connecting)?.icon} 
                      boxSize={16} 
                      color={accentColor} 
                      mb={4} 
                    />
                    <Heading size="md" mb={2}>
                      Authorize Access
                    </Heading>
                    <Text>
                      Please provide your credentials to authorize access to your 
                      {dataSources.find(s => s.id === connecting)?.name} account.
                    </Text>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="bold" mb={4}>
                      Data we'll analyze:
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      {dataSources.find(s => s.id === connecting)?.dataPoints.map((point, i) => (
                        <Flex key={i} align="center">
                          <Icon as={FaCheckCircle} color="green.500" mr={2} />
                          <Text>{point}</Text>
                        </Flex>
                      ))}
                    </SimpleGrid>
                  </Box>
                  
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Your data is secure</Text>
                      <Text fontSize="sm">
                        We use bank-level encryption and never store your credentials. 
                        You can disconnect access at any time.
                      </Text>
                    </Box>
                  </Alert>
                  
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <FormControl mb={4}>
                      <FormLabel>Email Address</FormLabel>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>Password</FormLabel>
                      <InputGroup>
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                        />
                        <InputRightElement>
                          <Icon as={FaLock} color="gray.500" />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    
                    <Button 
                      colorScheme="purple" 
                      size="lg" 
                      width="100%"
                      onClick={completeAuth}
                      leftIcon={<FaShieldAlt />}
                    >
                      Securely Connect
                    </Button>
                    
                    <Text fontSize="xs" textAlign="center" mt={2} color="gray.500">
                      By connecting, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        ) : (
          // Main Data Connect View
          <VStack spacing={8} align="stretch">
            {/* Header Section */}
            <Box textAlign="center" mb={4}>
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, purple.400, purple.600)" 
                bgClip="text"
                mb={2}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
              >
                <Text>finAI agent</Text>
                <Text fontSize="2xl" color="purple.500">$$$</Text>
              </Heading>
              <Text color={textColor} fontSize="lg">
                Connect your data sources for enhanced financial analysis
              </Text>
              <Button 
                as={NextLink} 
                href="/" 
                leftIcon={<FaArrowLeft />} 
                variant="ghost" 
                size="sm" 
                mt={2}
              >
                Back to Dashboard
              </Button>
            </Box>
            
            {/* Data Connections Box */}
            <Box 
              bg="white" 
              borderRadius="lg" 
              p={6} 
              shadow="md" 
              borderWidth="1px"
              borderColor="purple.100"
            >
              <VStack spacing={4} align="center">
                <Heading size="lg" color="purple.500">
                  Link Financial Accounts $$$
                </Heading>
                <Text align="center" color={textColor} fontSize="lg">
                  Connect to financial data sources to enhance your analysis.
                </Text>
                <Badge colorScheme="purple" p={2} borderRadius="md" fontSize="md">
                  {dataSources.filter(s => s.connected).length} OF {dataSources.length} CONNECTED
                </Badge>
              </VStack>
            </Box>
            
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Enhanced Analysis with Connected Data</Text>
                <Text>
                  Connect your financial accounts, emails, and notifications to get richer insights 
                  and real-time updates about your financial situation.
                </Text>
              </Box>
            </Alert>
            
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Icon as={FaEnvelope} mr={2} />
                Email Accounts
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedSources.email.map(source => (
                  <DataSourceCard 
                    key={source.id}
                    source={source}
                    onConnect={() => handleConnect(source.id)}
                    cardBgColor={cardBgColor}
                  />
                ))}
              </SimpleGrid>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Icon as={FaUniversity} mr={2} />
                Financial Accounts
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedSources.financial.map(source => (
                  <DataSourceCard 
                    key={source.id}
                    source={source}
                    onConnect={() => handleConnect(source.id)}
                    cardBgColor={cardBgColor}
                  />
                ))}
              </SimpleGrid>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Icon as={FaBell} mr={2} />
                Notifications & Alerts
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedSources.notifications.map(source => (
                  <DataSourceCard 
                    key={source.id}
                    source={source}
                    onConnect={() => handleConnect(source.id)}
                    cardBgColor={cardBgColor}
                  />
                ))}
              </SimpleGrid>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Icon as={FaFileInvoiceDollar} mr={2} />
                Documents & Receipts
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedSources.documents.map(source => (
                  <DataSourceCard 
                    key={source.id}
                    source={source}
                    onConnect={() => handleConnect(source.id)}
                    cardBgColor={cardBgColor}
                  />
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </Container>
    </Box>
  );
};

// Component for data source card
interface DataSourceCardProps {
  source: DataSource;
  onConnect: () => void;
  cardBgColor: string;
}

const DataSourceCard: React.FC<DataSourceCardProps> = ({ 
  source, 
  onConnect,
  cardBgColor
}) => {
  return (
    <Card 
      bg={cardBgColor} 
      shadow="md" 
      borderRadius="lg"
      borderLeft="4px solid"
      borderColor={source.connected ? "green.400" : "gray.200"}
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'lg'
      }}
    >
      <CardBody>
        <Flex justify="space-between" align="start">
          <Flex align="center">
            <Icon as={source.icon} boxSize={5} color={source.connected ? "green.500" : "gray.500"} mr={3} />
            <VStack align="start" spacing={0}>
              <Heading size="sm">{source.name}</Heading>
              <Text fontSize="xs" color="gray.500">
                {source.connected ? 'Connected' : 'Not connected'}
              </Text>
            </VStack>
          </Flex>
          <Switch 
            isChecked={source.connected} 
            onChange={onConnect}
            colorScheme="green"
            size="lg"
          />
        </Flex>
        
        <Text fontSize="sm" mt={3} mb={2}>
          {source.description}
        </Text>
        
        <Flex mt={2} align="center" justify="space-between">
          <Badge 
            colorScheme={source.connected ? "green" : "gray"}
            variant="subtle"
            px={2}
            py={1}
            borderRadius="full"
          >
            {source.connected ? 'Active' : 'Inactive'}
          </Badge>
          
          <Tooltip label="Learn more about data permissions" hasArrow placement="top">
            <Button 
              variant="ghost" 
              size="xs"
              rightIcon={<FaQuestion />}
              color="gray.500"
            >
              Data details
            </Button>
          </Tooltip>
        </Flex>
      </CardBody>
    </Card>
  );
};

export async function getStaticProps() {
  return {
    props: {},
  };
}

export default DataConnectPage; 