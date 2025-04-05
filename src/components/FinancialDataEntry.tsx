import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  SimpleGrid,
  Flex,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Icon,
  HStack,
  Badge,
  useColorModeValue,
  Container,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import { FaWallet, FaCreditCard, FaChartLine, FaMoneyBillWave, FaClipboardCheck, FaSave, FaDatabase } from 'react-icons/fa';
import { FinancialData, AnalysisResults } from '@/lib/financial-analysis-agent';

const FinancialDataEntry: React.FC = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // Financial data state - simplified to essential fields
  const [financialData, setFinancialData] = useState<FinancialData>({
    monthlyIncome: 5000,
    monthlyExpenses: 3000,
    savings: 10000,
    investments: 50000,
    debt: 120000
  });

  // Load saved financial data on component mount
  useEffect(() => {
    const fetchSavedData = async () => {
      try {
        const response = await fetch('/api/get-financial-data');
        
        if (!response.ok) {
          if (response.status !== 404) {
            console.error('Error fetching financial data:', response.statusText);
          }
          return;
        }

        const data = await response.json();
        if (data && data.financial_data) {
          setFinancialData(data.financial_data);
          toast({
            title: 'Data Loaded',
            description: 'Your saved financial data has been loaded',
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error loading financial data:', error);
      }
    };

    fetchSavedData();
  }, [toast]);

  // Handle form field changes
  const handleChange = (field: keyof FinancialData, value: string | number) => {
    // Ensure value is a number
    const numValue = typeof value === 'string' ? Number(value) || 0 : value;
    setFinancialData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Calculate key metrics locally to show immediately in UI
  const getMonthlySavings = () => financialData.monthlyIncome - financialData.monthlyExpenses;
  
  const getSavingsRate = () => {
    const income = financialData.monthlyIncome;
    if (income === 0) return 0;
    return (getMonthlySavings() / income) * 100;
  };
  
  const getNetWorth = () => financialData.savings + financialData.investments - financialData.debt;
  
  const getEmergencyFundMonths = () => financialData.savings / financialData.monthlyExpenses;
  
  const getDebtToIncomeRatio = () => {
    const annualIncome = financialData.monthlyIncome * 12;
    if (annualIncome === 0) return 0;
    return (financialData.debt / annualIncome) * 100;
  };

  // Save financial data directly via API
  const saveFinancialData = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/analyze-finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(financialData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResults(data);

      toast({
        title: 'Data Saved',
        description: 'Your financial data has been saved and analyzed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error in saving financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your financial data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  // Analyze finances using Claude API via our API endpoint
  const analyzeFinances = async () => {
    setIsLoading(true);
    await saveFinancialData();
  };

  // Financial Health Score calculation
  const calculateFinancialHealthScore = () => {
    if (!analysisResults) return 0;
    
    // Calculate score based on key metrics (0-100)
    let score = 0;
    
    // Savings rate (0-30 points)
    const { savingsRate } = analysisResults.metrics;
    if (savingsRate >= 20) score += 30;
    else score += (savingsRate / 20) * 30;
    
    // Emergency fund (0-30 points)
    const { emergencyFundMonths } = analysisResults.metrics;
    if (emergencyFundMonths >= 6) score += 30;
    else score += (emergencyFundMonths / 6) * 30;
    
    // Debt-to-income ratio (0-30 points)
    const { debtToIncomeRatio } = analysisResults.metrics;
    if (debtToIncomeRatio <= 20) score += 30;
    else if (debtToIncomeRatio > 43) score += 0;
    else score += ((43 - debtToIncomeRatio) / 23) * 30;
    
    // Net worth (0-10 points)
    const { netWorth } = analysisResults.metrics;
    if (netWorth > 0) score += 10;
    else score += 0;
    
    return Math.round(score);
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "green.400";
    if (score >= 60) return "blue.400";
    if (score >= 40) return "yellow.400";
    if (score >= 20) return "orange.400";
    return "red.400";
  };

  // Get badge color based on severity
  const getSeverityColor = (severity: string) => {
    if (severity === 'positive') return "green";
    if (severity === 'warning') return "orange";
    if (severity === 'critical') return "red";
    return "blue";
  };

  return (
    <Box>
      <Container maxW="container.xl" py={6}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={4}>
            <Heading 
              size="xl" 
              bgGradient="linear(to-r, blue.400, purple.500)" 
              bgClip="text"
              mb={2}
            >
              Financial Pulse
            </Heading>
            <Text color="gray.600">
              Get quick insights into your financial health with a few simple inputs
            </Text>
          </Box>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {/* Input Section */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="md" mb={2} color={accentColor}>
                      <Icon as={FaMoneyBillWave} mr={2} />
                      Your Financial Snapshot
                    </Heading>
                    <Button 
                      size="sm" 
                      leftIcon={<FaSave />} 
                      colorScheme="green" 
                      variant="outline"
                      onClick={saveFinancialData}
                      isLoading={isSaving}
                    >
                      Save Data
                    </Button>
                  </Flex>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel fontWeight="bold">Monthly Income</FormLabel>
                      <NumberInput
                        value={financialData.monthlyIncome}
                        onChange={(_, value) => handleChange('monthlyIncome', value)}
                        min={0}
                        precision={0}
                      >
                        <NumberInputField 
                          borderColor="gray.300"
                          _hover={{ borderColor: "blue.300" }}
                          bg="gray.50"
                          fontSize="lg"
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontWeight="bold">Monthly Expenses</FormLabel>
                      <NumberInput
                        value={financialData.monthlyExpenses}
                        onChange={(_, value) => handleChange('monthlyExpenses', value)}
                        min={0}
                        precision={0}
                      >
                        <NumberInputField 
                          borderColor="gray.300"
                          _hover={{ borderColor: "blue.300" }}
                          bg="gray.50"
                          fontSize="lg"
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                  
                  <Box py={2}>
                    <Text fontWeight="bold" mb={2}>Savings & Investments</Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Savings</FormLabel>
                        <NumberInput
                          value={financialData.savings}
                          onChange={(_, value) => handleChange('savings', value)}
                          min={0}
                          precision={0}
                        >
                          <NumberInputField 
                            borderColor="gray.300"
                            _hover={{ borderColor: "blue.300" }}
                            bg="gray.50"
                          />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Investments</FormLabel>
                        <NumberInput
                          value={financialData.investments}
                          onChange={(_, value) => handleChange('investments', value)}
                          min={0}
                          precision={0}
                        >
                          <NumberInputField 
                            borderColor="gray.300"
                            _hover={{ borderColor: "blue.300" }}
                            bg="gray.50"
                          />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                  
                  <FormControl>
                    <FormLabel fontWeight="bold">Total Debt</FormLabel>
                    <Slider
                      value={financialData.debt}
                      min={0}
                      max={500000}
                      step={5000}
                      onChange={(value) => handleChange('debt', value)}
                      mb={2}
                    >
                      <SliderTrack bg="gray.200">
                        <SliderFilledTrack bg={accentColor} />
                      </SliderTrack>
                      <SliderThumb boxSize={6} bg={accentColor}>
                        <Icon as={FaCreditCard} color="white" boxSize={3} />
                      </SliderThumb>
                      <SliderMark
                        value={financialData.debt}
                        textAlign='center'
                        bg={accentColor}
                        color='white'
                        mt='-10'
                        ml='-5'
                        w='12'
                        fontSize="xs"
                        borderRadius="md"
                      >
                        {financialData.debt >= 1000
                          ? `$${(financialData.debt / 1000).toFixed(0)}k`
                          : `$${financialData.debt}`}
                      </SliderMark>
                    </Slider>
                    <NumberInput
                      value={financialData.debt}
                      onChange={(_, value) => handleChange('debt', value)}
                      min={0}
                      precision={0}
                    >
                      <NumberInputField 
                        borderColor="gray.300"
                        _hover={{ borderColor: "blue.300" }}
                        bg="gray.50"
                        fontSize="lg"
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <Button 
                    colorScheme="blue" 
                    size="lg" 
                    onClick={analyzeFinances}
                    isLoading={isLoading}
                    mt={4}
                    fontWeight="bold"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                    leftIcon={<FaChartLine />}
                  >
                    Analyze My Finances
                  </Button>
                  
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    <Icon as={FaDatabase} mr={1} />
                    Data is saved and analyzed in your Supabase account
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            {/* Results Section */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
              <CardBody>
                {!analysisResults ? (
                  <VStack spacing={6} align="stretch" justify="center" height="100%" opacity={0.7}>
                    <Box textAlign="center" py={10}>
                      <Icon as={FaClipboardCheck} boxSize={16} color="gray.300" mb={4} />
                      <Heading size="md" color="gray.500">Enter your financial data</Heading>
                      <Text color="gray.500" mt={2}>
                        Then click "Analyze My Finances" to see your personalized financial insights
                      </Text>
                    </Box>
                  </VStack>
                ) : (
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md" color={accentColor}>
                        <Icon as={FaChartLine} mr={2} />
                        Financial Health Score
                      </Heading>
                      <Box
                        position="relative"
                        height="100px"
                        width="100px"
                      >
                        <CircularProgress 
                          size="100px"
                          value={calculateFinancialHealthScore()} 
                          color={getScoreColor(calculateFinancialHealthScore())}
                          thickness="8px"
                        />
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          textAlign="center"
                        >
                          <Text fontSize="2xl" fontWeight="bold">
                            {calculateFinancialHealthScore()}
                          </Text>
                          <Text fontSize="xs">out of 100</Text>
                        </Box>
                      </Box>
                    </Flex>
                    
                    <SimpleGrid columns={{ base: 2, md: 2 }} spacing={4} mb={2}>
                      <Stat>
                        <StatLabel>Monthly Savings</StatLabel>
                        <StatNumber color={analysisResults.metrics.monthlySavings >= 0 ? "green.500" : "red.500"}>
                          ${analysisResults.metrics.monthlySavings.toFixed(0)}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type={analysisResults.metrics.monthlySavings >= 0 ? "increase" : "decrease"} />
                          {analysisResults.metrics.savingsRate.toFixed(0)}% of income
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Net Worth</StatLabel>
                        <StatNumber color={analysisResults.metrics.netWorth >= 0 ? "green.500" : "red.500"}>
                          ${analysisResults.metrics.netWorth.toFixed(0)}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type={analysisResults.metrics.netWorth >= 0 ? "increase" : "decrease"} />
                          Assets − Debt
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                    
                    <Divider />
                    
                    <Heading size="sm" mb={2}>Key Insights & Recommendations</Heading>
                    
                    <VStack spacing={3} align="stretch">
                      {analysisResults.insights.map((insight, index) => (
                        <Box 
                          key={index} 
                          p={3} 
                          borderRadius="md" 
                          bg={`${getSeverityColor(insight.severity)}.50`}
                          borderLeft="4px solid" 
                          borderColor={`${getSeverityColor(insight.severity)}.500`}
                        >
                          <HStack mb={1}>
                            <Badge colorScheme={getSeverityColor(insight.severity)}>
                              {insight.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Text fontWeight="bold">{insight.message}</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {insight.recommendation}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

// Custom circular progress component
const CircularProgress: React.FC<{
  size: string;
  value: number;
  color: string;
  thickness: string;
}> = ({ size, value, color, thickness }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const dashoffset = circumference - progress;
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="gray.100"
        strokeWidth={thickness}
        opacity="0.2"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
};

export default FinancialDataEntry; 