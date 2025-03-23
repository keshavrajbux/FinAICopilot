import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  Select,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import demoService from '../services/demoService';
import AnalysisResults from './AnalysisResults';

const DemoMode = () => {
  const [demoScenario, setDemoScenario] = useState('default');
  const [income, setIncome] = useState(5000);
  const [expenses, setExpenses] = useState(3000);
  const [savings, setSavings] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const toast = useToast();

  const scenarios = {
    default: {
      name: 'Default Scenario',
      description: 'A balanced financial profile with moderate spending and saving habits.',
      transactions: [
        { date: '2024-03-01', description: 'Grocery Shopping', amount: 150.50, category: 'Food' },
        { date: '2024-03-02', description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment' },
        { date: '2024-03-03', description: 'Gas Station', amount: 45.00, category: 'Transportation' },
      ],
      portfolio: {
        stocks: [
          { symbol: 'AAPL', shares: 10, currentPrice: 175.50, purchasePrice: 150.00 },
          { symbol: 'GOOGL', shares: 5, currentPrice: 145.20, purchasePrice: 140.00 },
        ],
        bonds: [
          { type: 'US Treasury', value: 10000, yield: 0.04 },
        ],
      },
    },
    conservative: {
      name: 'Conservative Saver',
      description: 'A conservative financial profile with high savings and low risk investments.',
      transactions: [
        { date: '2024-03-01', description: 'Grocery Shopping', amount: 120.00, category: 'Food' },
        { date: '2024-03-02', description: 'Utility Bill', amount: 85.00, category: 'Utilities' },
        { date: '2024-03-03', description: 'Public Transport', amount: 25.00, category: 'Transportation' },
      ],
      portfolio: {
        stocks: [
          { symbol: 'VTI', shares: 15, currentPrice: 220.00, purchasePrice: 200.00 },
        ],
        bonds: [
          { type: 'US Treasury', value: 15000, yield: 0.04 },
          { type: 'Corporate Bonds', value: 10000, yield: 0.05 },
        ],
      },
    },
    aggressive: {
      name: 'Aggressive Investor',
      description: 'An aggressive financial profile with high-risk investments and variable spending.',
      transactions: [
        { date: '2024-03-01', description: 'Restaurant', amount: 200.00, category: 'Food' },
        { date: '2024-03-02', description: 'Entertainment', amount: 150.00, category: 'Entertainment' },
        { date: '2024-03-03', description: 'Car Payment', amount: 400.00, category: 'Transportation' },
      ],
      portfolio: {
        stocks: [
          { symbol: 'TSLA', shares: 20, currentPrice: 180.00, purchasePrice: 150.00 },
          { symbol: 'NVDA', shares: 10, currentPrice: 850.00, purchasePrice: 700.00 },
        ],
        bonds: [
          { type: 'High Yield Bonds', value: 5000, yield: 0.08 },
        ],
      },
    },
  };

  const handleScenarioChange = (event) => {
    const scenario = scenarios[event.target.value];
    setDemoScenario(event.target.value);
    setIncome(scenario.transactions.reduce((acc, t) => acc + t.amount, 0) + 2000);
    setExpenses(scenario.transactions.reduce((acc, t) => acc + t.amount, 0));
    setSavings(2000);
    setAnalysisResults(null);
    setError(null);
  };

  const startDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Start demo mode
      const result = demoService.startDemo(scenarios[demoScenario]);
      
      // Run analyses
      const [spendingAnalysis, investmentAnalysis, scenarioAnalysis] = await Promise.all([
        demoService.analyzeSpending(),
        demoService.analyzeInvestments(),
        demoService.analyzeScenarios(),
      ]);

      setAnalysisResults({
        spendingAnalysis,
        investmentAnalysis,
        scenarioAnalysis,
      });

      toast({
        title: 'Demo Mode Activated',
        description: 'Analysis completed successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to complete analysis. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} maxW="container.xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Demo Mode</Heading>
          <Text color="gray.600">
            Test the Financial Decision Copilot with simulated data. No real financial information required.
          </Text>
        </Box>

        <Card>
          <CardBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Select Demo Scenario</FormLabel>
                <Select value={demoScenario} onChange={handleScenarioChange}>
                  {Object.entries(scenarios).map(([key, scenario]) => (
                    <option key={key} value={key}>
                      {scenario.name}
                    </option>
                  ))}
                </Select>
                <Text mt={2} fontSize="sm" color="gray.600">
                  {scenarios[demoScenario].description}
                </Text>
              </FormControl>

              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="100%">
                <GridItem>
                  <Stat>
                    <StatLabel>Monthly Income</StatLabel>
                    <StatNumber>${income}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                    </StatHelpText>
                  </Stat>
                </GridItem>
                <GridItem>
                  <Stat>
                    <StatLabel>Monthly Expenses</StatLabel>
                    <StatNumber>${expenses}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="decrease" />
                    </StatHelpText>
                  </Stat>
                </GridItem>
                <GridItem>
                  <Stat>
                    <StatLabel>Monthly Savings</StatLabel>
                    <StatNumber>${savings}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                    </StatHelpText>
                  </Stat>
                </GridItem>
              </Grid>

              <Button 
                colorScheme="blue" 
                onClick={startDemo}
                isLoading={isLoading}
                loadingText="Analyzing..."
              >
                Start Demo Analysis
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" />
            <Text mt={4}>Running financial analysis...</Text>
          </Box>
        )}

        {analysisResults && <AnalysisResults {...analysisResults} />}

        <Box bg="gray.50" p={4} borderRadius="md">
          <Heading size="sm" mb={2}>Security Notice</Heading>
          <Text fontSize="sm" color="gray.600">
            This demo mode uses simulated data and does not require any real financial information.
            Your privacy and security are our top priorities. When you're ready to use real data,
            you can connect your accounts through our secure, encrypted connection.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default DemoMode; 