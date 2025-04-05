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
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react';
import { FaWallet, FaCreditCard, FaChartLine, FaMoneyBillWave, FaClipboardCheck, FaSave, FaDatabase } from 'react-icons/fa';
import { FinancialData, AnalysisResults } from '@/lib/financial-analysis-agent';

const FinancialDataEntry: React.FC = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('purple.300', 'purple.400');
  const bgColor = useColorModeValue('purple.50', 'gray.900');
  const textColor = useColorModeValue('purple.800', 'purple.100');
  
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
  const saveFinancialData = async (showToast = true) => {
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

      // Check if we're using fallback calculations
      if (data._note && data._note.includes('local calculations')) {
        toast({
          title: 'Using Local Analysis',
          description: 'Could not connect to the analysis server. Using local calculations instead.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      } else if (showToast) {
        toast({
          title: 'Data Saved',
          description: 'Your financial data has been saved and analyzed',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error in saving financial data:', error);
      
      // Generate client-side fallback analysis
      const monthlySavings = financialData.monthlyIncome - financialData.monthlyExpenses;
      const savingsRate = financialData.monthlyIncome > 0 ? (monthlySavings / financialData.monthlyIncome) * 100 : 0;
      const netWorth = financialData.savings + financialData.investments - financialData.debt;
      const emergencyFundMonths = financialData.monthlyExpenses > 0 ? financialData.savings / financialData.monthlyExpenses : 0;
      const debtToIncomeRatio = financialData.monthlyIncome > 0 ? (financialData.debt / (financialData.monthlyIncome * 12)) * 100 : 0;
      
      // Create fallback analysis results
      const fallbackResults: AnalysisResults = {
        metrics: {
          savingsRate,
          netWorth,
          emergencyFundMonths,
          debtToIncomeRatio,
          monthlySavings
        },
        insights: [
          {
            type: "savings_rate",
            severity: savingsRate >= 20 ? "positive" : (savingsRate >= 10 ? "warning" : "critical"),
            message: `Your savings rate is ${savingsRate.toFixed(1)}%`,
            recommendation: savingsRate < 20 ? "Aim to save at least 20% of your income" : "Keep up the good work!"
          },
          {
            type: "emergency_fund",
            severity: emergencyFundMonths >= 6 ? "positive" : (emergencyFundMonths >= 3 ? "warning" : "critical"),
            message: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses`,
            recommendation: emergencyFundMonths < 6 ? "Build an emergency fund covering 3-6 months of expenses" : "Consider investing excess emergency savings"
          },
          {
            type: "debt_ratio",
            severity: debtToIncomeRatio <= 36 ? "positive" : (debtToIncomeRatio <= 43 ? "warning" : "critical"),
            message: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%`,
            recommendation: debtToIncomeRatio > 36 ? "Reduce your debt load to improve financial flexibility" : "Your debt level is manageable"
          },
          {
            type: "net_worth",
            severity: netWorth > 0 ? "positive" : "critical",
            message: `Your net worth is ${netWorth >= 0 ? '$' + netWorth.toFixed(0) : '-$' + Math.abs(netWorth).toFixed(0)}`,
            recommendation: netWorth < 0 ? "Focus on paying down debts to achieve a positive net worth" : "Continue building assets to increase your net worth"
          }
        ]
      };
      
      // Use the fallback results
      setAnalysisResults(fallbackResults);
      
      toast({
        title: 'Using Local Analysis',
        description: 'Could not connect to the analysis server. Using local calculations instead.',
        status: 'warning',
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
    await saveFinancialData(false); // Don't show toast during analysis
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
        <VStack spacing={8} align="stretch">
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
              Get quick insights into your financial health with a few simple inputs
            </Text>
          </Box>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {/* Input Section */}
            <Card 
              bg={cardBg} 
              shadow="lg" 
              borderRadius="lg" 
              overflow="hidden"
              border="1px solid"
              borderColor="purple.100"
              _hover={{
                transform: 'translateY(-2px)',
                transition: 'all 0.2s',
                boxShadow: 'xl'
              }}
            >
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
                      colorScheme="purple" 
                      variant="outline"
                      onClick={() => saveFinancialData(true)}
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
                    colorScheme="purple" 
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
                  
                  <Text fontSize="xs" color={textColor} textAlign="center">
                    <Icon as={FaDatabase} mr={1} />
                    Data is saved and analyzed in your Supabase account
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            {/* Results Section */}
            <Card 
              bg={cardBg} 
              shadow="lg" 
              borderRadius="lg" 
              overflow="hidden"
              border="1px solid"
              borderColor="purple.100"
              _hover={{
                transform: 'translateY(-2px)',
                transition: 'all 0.2s',
                boxShadow: 'xl'
              }}
            >
              <CardBody>
                {!analysisResults ? (
                  <VStack spacing={6} align="stretch" justify="center" height="100%" opacity={0.7}>
                    <Box textAlign="center" py={10}>
                      <Icon as={FaClipboardCheck} boxSize={16} color="purple.300" mb={4} />
                      <Heading size="md" color={textColor}>Enter your financial data</Heading>
                      <Text color={textColor} mt={2}>
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
                        >
                          <CircularProgressLabel>
                            {calculateFinancialHealthScore()}
                          </CircularProgressLabel>
                        </CircularProgress>
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

export default FinancialDataEntry; 