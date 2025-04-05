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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
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
} from '@chakra-ui/react';
import { FaWallet, FaUniversity, FaCreditCard, FaChartLine, FaMoneyBillWave, FaClipboardCheck, FaSave, FaDatabase } from 'react-icons/fa';
import supabase from '../utils/supabase';

const FinancialDataEntry = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const [userId] = useState('demo-user-123'); // In a real app, this would come from authentication
  
  // Financial data state - simplified to essential fields
  const [financialData, setFinancialData] = useState({
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
        const { data, error } = await supabase
          .from('financial_data')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error('Error fetching financial data:', error);
          return;
        }

        if (data) {
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
  }, [userId, toast]);

  // Handle form field changes
  const handleChange = (field, value) => {
    // Ensure value is a number
    const numValue = Number(value) || 0;
    setFinancialData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Calculate key metrics
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

  // Save financial data to Supabase
  const saveFinancialData = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('financial_data')
        .insert([{
          user_id: userId,
          financial_data: financialData,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error saving financial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your financial data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      toast({
        title: 'Data Saved',
        description: 'Your financial data has been saved successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error in saving financial data:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate analysis based on provided data
  const analyzeFinances = async () => {
    setIsLoading(true);
    
    // Save the financial data first
    await saveFinancialData();
    
    // Simulate API call with shorter timeout (500ms instead of 1500ms)
    setTimeout(() => {
      const savingsRate = getSavingsRate();
      const netWorth = getNetWorth();
      const emergencyFundMonths = getEmergencyFundMonths();
      const debtToIncomeRatio = getDebtToIncomeRatio();
      
      // Generate insights
      const insights = [];
      
      // Savings rate insights
      if (savingsRate < 10) {
        insights.push({
          type: 'savings_rate',
          severity: 'critical',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%, which is below the recommended 20%`,
          recommendation: 'Try to reduce expenses or increase income'
        });
      } else if (savingsRate < 20) {
        insights.push({
          type: 'savings_rate',
          severity: 'warning',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%, which is below the recommended 20%`,
          recommendation: 'Look for areas to reduce expenses'
        });
      } else {
        insights.push({
          type: 'savings_rate',
          severity: 'positive',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%, which is healthy`,
          recommendation: 'Consider investing more of your savings'
        });
      }
      
      // Emergency fund insights
      if (emergencyFundMonths < 3) {
        insights.push({
          type: 'emergency_fund',
          severity: 'critical',
          message: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses`,
          recommendation: 'Build 3-6 months of expenses in savings'
        });
      } else if (emergencyFundMonths < 6) {
        insights.push({
          type: 'emergency_fund',
          severity: 'warning',
          message: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses`,
          recommendation: 'Continue building towards 6 months of expenses'
        });
      } else {
        insights.push({
          type: 'emergency_fund',
          severity: 'positive',
          message: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses`,
          recommendation: 'Your emergency fund is in great shape'
        });
      }
      
      // Debt insights
      if (debtToIncomeRatio > 43) {
        insights.push({
          type: 'debt_ratio',
          severity: 'critical',
          message: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%`,
          recommendation: 'Focus on paying down high-interest debt'
        });
      } else if (debtToIncomeRatio > 36) {
        insights.push({
          type: 'debt_ratio',
          severity: 'warning',
          message: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%`,
          recommendation: 'Consider strategies to reduce your debt'
        });
      } else {
        insights.push({
          type: 'debt_ratio',
          severity: 'positive',
          message: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%`,
          recommendation: 'Your debt level is manageable'
        });
      }
      
      // Net worth insights
      if (netWorth < 0) {
        insights.push({
          type: 'net_worth',
          severity: 'critical',
          message: 'Your net worth is negative',
          recommendation: 'Focus on debt reduction and increasing assets'
        });
      } else if (netWorth < financialData.monthlyIncome * 6) {
        insights.push({
          type: 'net_worth',
          severity: 'warning',
          message: 'Your net worth is positive but relatively low',
          recommendation: 'Continue building your assets and reducing debt'
        });
      } else {
        insights.push({
          type: 'net_worth',
          severity: 'positive',
          message: 'Your net worth is healthy',
          recommendation: 'Continue your current financial strategy'
        });
      }
      
      const analysisData = {
        metrics: {
          savingsRate,
          netWorth,
          emergencyFundMonths,
          debtToIncomeRatio,
          monthlySavings: getMonthlySavings()
        },
        insights
      };
      
      setAnalysisResults(analysisData);
      
      // Save analysis results to Supabase
      const saveAnalysis = async () => {
        try {
          const { data, error } = await supabase
            .from('financial_analyses')
            .insert([{
              user_id: userId,
              analysis_data: analysisData,
              created_at: new Date().toISOString()
            }]);

          if (error) {
            console.error('Error saving analysis:', error);
          }
        } catch (error) {
          console.error('Error in saving analysis:', error);
        }
      };
      
      saveAnalysis();
      
      setIsLoading(false);
      toast({
        title: 'Analysis Complete',
        description: 'Financial insights are ready',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }, 500);
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
  const getScoreColor = (score) => {
    if (score >= 80) return "green.400";
    if (score >= 60) return "blue.400";
    if (score >= 40) return "yellow.400";
    if (score >= 20) return "orange.400";
    return "red.400";
  };

  // Get badge color based on severity
  const getSeverityColor = (severity) => {
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
                        onChange={(value) => handleChange('monthlyIncome', value)}
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
                        onChange={(value) => handleChange('monthlyExpenses', value)}
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
                          onChange={(value) => handleChange('savings', value)}
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
                          onChange={(value) => handleChange('investments', value)}
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
                      onChange={(value) => handleChange('debt', value)}
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
const CircularProgress = ({ size, value, color, thickness }) => {
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