import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Switch,
  FormControl,
  FormLabel,
  Input,
  Icon,
  HStack,
  Spinner,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { FaEnvelope, FaBell, FaUniversity, FaCreditCard, FaCheck, FaTimes } from 'react-icons/fa';

// Mock API service - in a real app, this would be replaced with actual API calls
const apiService = {
  async getDataSources() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      sources: [
        { id: 'email', name: 'Email Accounts', description: 'Extract financial data from email receipts and notifications', icon: FaEnvelope },
        { id: 'notifications', name: 'Device Notifications', description: 'Access transaction notifications from your device', icon: FaBell },
        { id: 'bankAccount', name: 'Bank Accounts', description: 'Connect directly to your bank accounts', icon: FaUniversity },
        { id: 'creditCard', name: 'Credit Cards', description: 'Monitor credit card transactions and balances', icon: FaCreditCard }
      ]
    };
  },
  
  async connectSource(userId, source, credentials) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful connection
    return {
      success: true,
      source,
      message: `Successfully connected to ${source}`
    };
  },
  
  async disconnectSource(userId, source) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Disconnected from ${source}`
    };
  },
  
  async getInsights(userId) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      profile: {
        income: 5500,
        expenses: 3200,
        savings: 2300,
        assets: 25000,
        liabilities: 15000
      },
      insights: [
        {
          type: 'savings_rate',
          severity: 'positive',
          message: 'Your savings rate is 41.8%, which is healthy',
          recommendation: 'Consider investing your extra savings for long-term growth'
        },
        {
          type: 'spending_category',
          severity: 'warning',
          message: 'Your dining spending has increased 35% this month',
          recommendation: 'Consider cooking at home more often to reduce food expenses'
        },
        {
          type: 'bill_alert',
          severity: 'warning',
          message: 'You have 3 bills due in the next 7 days totaling $320',
          recommendation: 'Ensure you have sufficient funds in your checking account'
        }
      ],
      alerts: [
        {
          type: 'low_balance',
          message: 'Your checking account balance is below $250',
          timestamp: new Date()
        }
      ]
    };
  }
};

const DataConnector = () => {
  const [userId] = useState('demo-user-123'); // In a real app, this would come from authentication
  const [availableSources, setAvailableSources] = useState([]);
  const [connectedSources, setConnectedSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [currentSource, setCurrentSource] = useState(null);
  const [credentials, setCredentials] = useState({ apiKey: '' });
  const [insights, setInsights] = useState(null);
  const [syncingInsights, setSyncingInsights] = useState(false);
  const toast = useToast();

  // Fetch available data sources on component mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const result = await apiService.getDataSources();
        if (result.success) {
          setAvailableSources(result.sources);
        }
      } catch (error) {
        toast({
          title: 'Error fetching data sources',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, [toast]);

  const handleConnect = async (source) => {
    setCurrentSource(source);
    setCredentials({ apiKey: '' }); // Reset credentials
  };

  const handleCredentialChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitCredentials = async () => {
    if (!credentials.apiKey) {
      toast({
        title: 'Validation Error',
        description: 'API Key is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setConnecting(true);
    try {
      const result = await apiService.connectSource(userId, currentSource.id, credentials);
      if (result.success) {
        setConnectedSources([...connectedSources, currentSource.id]);
        toast({
          title: 'Connection Successful',
          description: `Connected to ${currentSource.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setCurrentSource(null);
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (sourceId) => {
    try {
      const result = await apiService.disconnectSource(userId, sourceId);
      if (result.success) {
        setConnectedSources(connectedSources.filter(id => id !== sourceId));
        toast({
          title: 'Disconnected',
          description: `Disconnected from ${availableSources.find(s => s.id === sourceId)?.name}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const refreshInsights = async () => {
    setSyncingInsights(true);
    try {
      const result = await apiService.getInsights(userId);
      if (result.success) {
        setInsights(result);
        toast({
          title: 'Insights Updated',
          description: 'Financial insights refreshed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncingInsights(false);
    }
  };

  const renderSeverityBadge = (severity) => {
    const colorScheme = 
      severity === 'critical' ? 'red' : 
      severity === 'warning' ? 'orange' : 
      severity === 'positive' ? 'green' : 'blue';
    
    return (
      <Badge colorScheme={colorScheme} mr={2}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Financial Data Connect</Heading>
          <Text color="gray.600">
            Connect to your financial data sources for personalized insights and recommendations
          </Text>
        </Box>

        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading data sources...</Text>
          </Box>
        ) : (
          <>
            <Card>
              <CardHeader>
                <Heading size="md">Connect Data Sources</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {availableSources.map((source) => (
                    <Card key={source.id} variant="outline">
                      <CardBody>
                        <HStack justifyContent="space-between">
                          <HStack>
                            <Icon as={source.icon} boxSize={6} color="blue.500" />
                            <Box ml={2}>
                              <Heading size="sm">{source.name}</Heading>
                              <Text fontSize="sm" color="gray.600">{source.description}</Text>
                            </Box>
                          </HStack>
                          {connectedSources.includes(source.id) ? (
                            <HStack>
                              <Icon as={FaCheck} color="green.500" />
                              <Button 
                                size="sm" 
                                colorScheme="red" 
                                variant="ghost"
                                onClick={() => handleDisconnect(source.id)}
                              >
                                Disconnect
                              </Button>
                            </HStack>
                          ) : (
                            <Button 
                              colorScheme="blue" 
                              variant="solid" 
                              size="sm"
                              onClick={() => handleConnect(source)}
                            >
                              Connect
                            </Button>
                          )}
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {currentSource && (
                  <Card mt={6} variant="filled">
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Connect to {currentSource.name}</Heading>
                        <FormControl>
                          <FormLabel>API Key</FormLabel>
                          <Input 
                            type="password" 
                            name="apiKey" 
                            value={credentials.apiKey} 
                            onChange={handleCredentialChange}
                            placeholder="Enter your API key"
                          />
                        </FormControl>
                        <HStack justifyContent="flex-end">
                          <Button 
                            variant="ghost" 
                            onClick={() => setCurrentSource(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            colorScheme="blue" 
                            onClick={handleSubmitCredentials}
                            isLoading={connecting}
                          >
                            Connect
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <HStack justifyContent="space-between">
                  <Heading size="md">Financial Insights</Heading>
                  <Button 
                    colorScheme="blue" 
                    size="sm" 
                    onClick={refreshInsights}
                    isLoading={syncingInsights}
                    isDisabled={connectedSources.length === 0}
                  >
                    Refresh Insights
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                {connectedSources.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Text>Connect to data sources to see insights</Text>
                  </Box>
                ) : insights ? (
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Card variant="outline">
                        <CardBody>
                          <Heading size="sm" mb={2}>Monthly Income</Heading>
                          <Heading size="lg" color="green.500">${insights.profile.income}</Heading>
                        </CardBody>
                      </Card>
                      <Card variant="outline">
                        <CardBody>
                          <Heading size="sm" mb={2}>Monthly Expenses</Heading>
                          <Heading size="lg" color="red.500">${insights.profile.expenses}</Heading>
                        </CardBody>
                      </Card>
                      <Card variant="outline">
                        <CardBody>
                          <Heading size="sm" mb={2}>Monthly Savings</Heading>
                          <Heading size="lg" color="blue.500">${insights.profile.savings}</Heading>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    <Accordion allowMultiple defaultIndex={[0]}>
                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <Heading size="sm">Insights & Recommendations</Heading>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <VStack spacing={4} align="stretch">
                            {insights.insights.map((insight, index) => (
                              <Card key={index} variant="outline">
                                <CardBody>
                                  <HStack mb={2}>
                                    {renderSeverityBadge(insight.severity)}
                                    <Text fontWeight="bold">{insight.message}</Text>
                                  </HStack>
                                  <Text color="gray.600">
                                    <strong>Recommendation:</strong> {insight.recommendation}
                                  </Text>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>

                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <Heading size="sm">Alerts</Heading>
                              {insights.alerts.length > 0 && (
                                <Badge ml={2} colorScheme="red">{insights.alerts.length}</Badge>
                              )}
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          {insights.alerts.length > 0 ? (
                            <VStack spacing={4} align="stretch">
                              {insights.alerts.map((alert, index) => (
                                <Card key={index} variant="outline" borderColor="red.300">
                                  <CardBody>
                                    <HStack>
                                      <Icon as={FaBell} color="red.500" />
                                      <Text>{alert.message}</Text>
                                    </HStack>
                                  </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          ) : (
                            <Text>No alerts at this time.</Text>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </VStack>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Text>Click "Refresh Insights" to get your financial analysis</Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default DataConnector; 