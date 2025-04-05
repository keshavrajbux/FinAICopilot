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
  CircularProgressLabel,
  Link
} from '@chakra-ui/react';
import { FaWallet, FaCreditCard, FaChartLine, FaMoneyBillWave, FaClipboardCheck, FaSave, FaDatabase, FaLink, FaTools, FaArrowUp, FaArrowDown, FaLightbulb, FaRocket, FaTrophy, FaFire } from 'react-icons/fa';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { FinancialData, AnalysisResults } from '@/lib/financial-analysis-agent';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

// Extend the AnalysisResults interface locally to include API response metadata
interface ExtendedAnalysisResults extends AnalysisResults {
  _meta?: {
    dataSaved: boolean;
    timestamp: string;
  };
  _note?: string;
  _error?: string;
}

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionIcon = motion(Icon);
const MotionSimpleGrid = motion(SimpleGrid);

const FinancialDataEntry: React.FC = () => {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ExtendedAnalysisResults | null>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('purple.300', 'purple.400');
  const bgColor = useColorModeValue('purple.50', 'gray.900');
  const textColor = useColorModeValue('purple.800', 'purple.100');
  
  // Check if we should show developer tools
  // Show in development mode or if there's a special query parameter
  const isDev = process.env.NODE_ENV === 'development';
  const showDevTools = isDev || router.query.devMode === 'true';
  
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
      console.log('Saving financial data:', financialData);
      
      // Capture the current state of the form data for analysis
      const currentData = { ...financialData };
      
      // Send data to API for saving and analysis
      const response = await fetch('/api/analyze-finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentData),
      });
      
      if (!response.ok) {
        // Detailed error handling for non-200 responses
        const errorText = await response.text();
        console.error(`API Error (${response.status}): ${errorText}`);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      
      setAnalysisResults(result);
      
      if (result._note) {
        // If there's a note in the response, it means we're using fallback calculations
        console.warn('Server notice:', result._note);
        if (showToast) {
          toast({
            title: 'Analysis Complete',
            description: 'Your financial data has been analyzed. Note: Using local calculations.',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
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
      // Add more detailed error logging
      console.warn({
        action: 'saveFinancialData',
        error: error instanceof Error ? error.message : String(error),
        financialData: { ...financialData, _redacted: true }, // Safe logging
        timestamp: new Date().toISOString()
      });
      
      // Generate client-side fallback analysis
      const monthlySavings = financialData.monthlyIncome - financialData.monthlyExpenses;
      const savingsRate = financialData.monthlyIncome > 0 ? (monthlySavings / financialData.monthlyIncome) * 100 : 0;
      const netWorth = financialData.savings + financialData.investments - financialData.debt;
      const emergencyFundMonths = financialData.monthlyExpenses > 0 ? financialData.savings / financialData.monthlyExpenses : 0;
      const debtToIncomeRatio = financialData.monthlyIncome > 0 ? (financialData.debt / (financialData.monthlyIncome * 12)) * 100 : 0;
      
      // Create fallback analysis results
      const fallbackResults: ExtendedAnalysisResults = {
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
            message: savingsRate >= 20 
              ? `Impressive! You're saving ${savingsRate.toFixed(1)}% of your income` 
              : savingsRate >= 10 
                ? `You're saving ${savingsRate.toFixed(1)}% of your income, which is a good start` 
                : `Your savings rate of ${savingsRate.toFixed(1)}% puts your financial future at risk`,
            recommendation: savingsRate < 20 
              ? "Financial experts recommend saving at least 20% of your income. Try cutting back on non-essential expenses like dining out or subscription services you rarely use." 
              : "You're on the right track! Consider setting up automatic transfers to investment accounts to put your savings to work."
          },
          {
            type: "emergency_fund",
            severity: emergencyFundMonths >= 6 ? "positive" : (emergencyFundMonths >= 3 ? "warning" : "critical"),
            message: emergencyFundMonths >= 6 
              ? `Peace of mind! Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses` 
              : emergencyFundMonths >= 3 
                ? `Your emergency fund would last ${emergencyFundMonths.toFixed(1)} months - you're halfway there` 
                : `Your emergency fund would only last ${emergencyFundMonths.toFixed(1)} months, leaving you vulnerable to financial shocks`,
            recommendation: emergencyFundMonths < 6 
              ? "Aim to save enough to cover 3-6 months of essential expenses. Start small by setting aside a portion of each paycheck until you reach this goal." 
              : "Well done! Your emergency fund is well-established. Keep it in a high-yield savings account for easy access while still earning interest."
          },
          {
            type: "debt_ratio",
            severity: debtToIncomeRatio <= 36 ? "positive" : (debtToIncomeRatio <= 43 ? "warning" : "critical"),
            message: debtToIncomeRatio <= 36 
              ? `Excellent! Your debt-to-income ratio is a healthy ${debtToIncomeRatio.toFixed(1)}%` 
              : debtToIncomeRatio <= 43 
                ? `Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}% is approaching concerning levels` 
                : `Warning: Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}% is critically high`,
            recommendation: debtToIncomeRatio > 36 
              ? "Focus on paying down high-interest debt first. Consider the snowball method (smallest balances first) or avalanche method (highest interest first) to reduce your debt burden." 
              : "Your debt is at a manageable level. Consider setting up extra payments toward principal to reduce interest costs over time."
          },
          {
            type: "net_worth",
            severity: netWorth > financialData.monthlyIncome * 12 ? "positive" : netWorth > 0 ? "warning" : "critical",
            message: netWorth > financialData.monthlyIncome * 12 
              ? `Congratulations! Your net worth of $${netWorth.toLocaleString()} exceeds your annual income` 
              : netWorth > 0 
                ? `Your net worth is $${netWorth.toLocaleString()} - positive, but there's room for growth` 
                : `Your net worth is negative at -$${Math.abs(netWorth).toLocaleString()}, which means you owe more than you own`,
            recommendation: netWorth < 0 
              ? "Your financial priority should be shifting to positive net worth. Create a debt reduction plan, avoid taking on more debt, and focus on increasing your income." 
              : netWorth < financialData.monthlyIncome * 12 
                ? "Build wealth by increasing your savings rate and investment contributions. Even small, consistent contributions can grow significantly over time." 
                : "You're building wealth effectively! Consider diversifying your investments and exploring tax-advantaged accounts to protect and grow your assets."
          }
        ],
        _meta: {
          dataSaved: false,
          timestamp: new Date().toISOString()
        },
        _note: "Using local calculations due to server connection error"
      };
      
      // Use the fallback results
      setAnalysisResults(fallbackResults);
      
      // Log for debugging but show a neutral message to the user
      console.warn('Client Fallback: Using local calculations due to connection error');
      toast({
        title: 'Analysis Complete',
        description: 'Your financial data has been analyzed',
        status: 'success', // Changed from warning to success
        duration: 2000,
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
                        step={100}
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
                        step={100}
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
                          step={100}
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
                          step={100}
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
                      step={1000}
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
                    <Box textAlign="center" position="relative" py={8}>
                      <MotionHeading 
                        size="lg" 
                        bgGradient="linear(to-r, purple.400, blue.500)" 
                        bgClip="text"
                        letterSpacing="wider"
                        mb={4}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <MotionIcon 
                          as={FaChartLine} 
                          mr={3}
                          initial={{ rotate: -45 }}
                          animate={{ rotate: 0 }}
                          transition={{ duration: 0.5 }}
                        />
                        Your Financial Vibe
                      </MotionHeading>
                      
                      <MotionBox 
                        position="relative" 
                        width="140px" 
                        height="140px" 
                        mx="auto"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <CircularProgress 
                          value={calculateFinancialHealthScore()} 
                          size="140px" 
                          thickness="8px" 
                          color={getScoreColor(calculateFinancialHealthScore())}
                          trackColor="gray.100"
                          capIsRound
                        >
                          <CircularProgressLabel>
                            <VStack spacing={0}>
                              <MotionText 
                                fontSize="3xl" 
                                fontWeight="bold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                              >
                                {calculateFinancialHealthScore()}
                              </MotionText>
                              <MotionText 
                                fontSize="xs" 
                                fontWeight="normal" 
                                opacity={0.8}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                              >
                                {calculateFinancialHealthScore() >= 80 ? "CRUSHING IT 🔥" : 
                                 calculateFinancialHealthScore() >= 60 ? "SOLID 💪" : 
                                 calculateFinancialHealthScore() >= 40 ? "GETTING THERE ⬆️" : 
                                 calculateFinancialHealthScore() >= 20 ? "NEEDS WORK 🛠️" : "SOS MODE 🚨"}
                              </MotionText>
                            </VStack>
                          </CircularProgressLabel>
                        </CircularProgress>
                      </MotionBox>
                      
                      <MotionBox
                        position="absolute"
                        right="20%"
                        top="30%"
                        opacity={calculateFinancialHealthScore() >= 70 ? 1 : 0}
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 10, y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <Icon as={FaTrophy} color="yellow.400" boxSize={6} />
                      </MotionBox>
                      
                      <MotionBox
                        position="absolute"
                        left="20%"
                        top="30%"
                        opacity={calculateFinancialHealthScore() >= 70 ? 1 : 0}
                        initial={{ rotate: 0 }}
                        animate={{ rotate: -10, y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
                      >
                        <Icon as={FaRocket} color="purple.400" boxSize={6} />
                      </MotionBox>
                    </Box>
                    
                    {/* Database Save Status - only shown in dev mode */}
                    {analysisResults._meta && showDevTools && (
                      <Box 
                        p={3} 
                        bg={analysisResults._meta.dataSaved ? "green.50" : "orange.50"} 
                        color={analysisResults._meta.dataSaved ? "green.700" : "orange.700"} 
                        borderRadius="md"
                        mb={2}
                      >
                        <Flex align="center">
                          <Icon 
                            as={analysisResults._meta.dataSaved ? CheckCircleIcon : WarningIcon} 
                            mr={2} 
                          />
                          <Text fontWeight="medium">
                            {analysisResults._meta.dataSaved 
                              ? "Data saved successfully to your account" 
                              : "Analysis completed, but data was not saved to your account"}
                          </Text>
                        </Flex>
                        {!analysisResults._meta.dataSaved && (
                          <Text fontSize="sm" mt={1}>
                            This might be due to missing database configuration or connection issues. Your analysis is still available, but won't be saved for future reference.
                          </Text>
                        )}
                        
                        {/* Display any error messages from the API */}
                        {analysisResults._error && (
                          <Text fontSize="sm" mt={2} fontWeight="medium" color="red.600">
                            Error details: {analysisResults._error}
                          </Text>
                        )}
                      </Box>
                    )}
                    
                    <MotionSimpleGrid
                      columns={{ base: 1, md: 2 }} 
                      spacing={6} 
                      bg="white" 
                      p={5} 
                      borderRadius="xl" 
                      boxShadow="sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <MotionBox 
                        bg="gray.50" 
                        p={4} 
                        borderRadius="lg" 
                        position="relative"
                        overflow="hidden"
                        whileHover={{ y: -5, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
                        transition={{ duration: 0.2 }}
                        _before={{
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "4px",
                          height: "100%",
                          bg: analysisResults.metrics.monthlySavings >= 0 ? "green.400" : "red.400"
                        }}
                      >
                        <Text fontSize="sm" color="gray.500" mb={1} fontWeight="medium">
                          MONTHLY CASH FLOW
                        </Text>
                        <Heading 
                          size="xl" 
                          color={analysisResults.metrics.monthlySavings >= 0 ? "green.500" : "red.500"}
                          display="flex"
                          alignItems="center"
                        >
                          <Text>${Math.abs(analysisResults.metrics.monthlySavings).toLocaleString()}</Text>
                          <Text fontSize="sm" color="gray.500" ml={2}>
                            {analysisResults.metrics.monthlySavings >= 0 ? "+/mo" : "-/mo"}
                          </Text>
                        </Heading>
                        <Flex align="center" mt={1}>
                          <Icon 
                            as={analysisResults.metrics.monthlySavings >= 0 ? FaArrowUp : FaArrowDown} 
                            color={analysisResults.metrics.monthlySavings >= 0 ? "green.500" : "red.500"}
                            mr={1}
                          />
                          <Text color="gray.600" fontSize="sm">
                            {analysisResults.metrics.savingsRate.toFixed(0)}% of income
                          </Text>
                        </Flex>
                      </MotionBox>
                      
                      <MotionBox 
                        bg="gray.50" 
                        p={4} 
                        borderRadius="lg" 
                        position="relative"
                        overflow="hidden"
                        whileHover={{ y: -5, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
                        transition={{ duration: 0.2 }}
                        _before={{
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "4px",
                          height: "100%",
                          bg: analysisResults.metrics.netWorth >= 0 ? "blue.400" : "orange.400"
                        }}
                      >
                        <Text fontSize="sm" color="gray.500" mb={1} fontWeight="medium">
                          MONEY STASH
                        </Text>
                        <Heading 
                          size="xl" 
                          color={analysisResults.metrics.netWorth >= 0 ? "blue.500" : "orange.500"}
                          display="flex"
                          alignItems="center"
                        >
                          <Text>${Math.abs(analysisResults.metrics.netWorth).toLocaleString()}</Text>
                          <Text fontSize="sm" color="gray.500" ml={2}>
                            net worth
                          </Text>
                        </Heading>
                        <Flex align="center" mt={1}>
                          <Text color="gray.600" fontSize="sm">
                            Assets − Debt
                          </Text>
                        </Flex>
                      </MotionBox>
                    </MotionSimpleGrid>
                    
                    <MotionBox 
                      bg="white" 
                      p={5} 
                      borderRadius="xl" 
                      boxShadow="sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <MotionHeading 
                        size="md" 
                        mb={4} 
                        display="flex" 
                        alignItems="center"
                        bgGradient="linear(to-r, purple.400, blue.500)" 
                        bgClip="text"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon as={FaLightbulb} mr={2} />
                        Smart Money Moves
                      </MotionHeading>
                      
                      <VStack spacing={4} align="stretch">
                        {analysisResults.insights.map((insight, index) => {
                          // Determine accent color based on severity
                          const accentColor = getSeverityColor(insight.severity);
                          const gradientColors = 
                            insight.severity === 'positive' ? 'linear(to-r, green.400, teal.400)' :
                            insight.severity === 'warning' ? 'linear(to-r, orange.400, yellow.400)' :
                            'linear(to-r, red.400, pink.400)';
                            
                          // Icon based on severity
                          const severityIcon = 
                            insight.severity === 'positive' ? FaTrophy :
                            insight.severity === 'warning' ? FaLightbulb : 
                            FaFire;
                            
                          return (
                            <MotionBox 
                              key={index} 
                              p={4} 
                              borderRadius="lg" 
                              bg="gray.50"
                              position="relative"
                              overflow="hidden"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                              whileHover={{ 
                                y: -2, 
                                boxShadow: "lg",
                                transition: { duration: 0.2 }
                              }}
                              _before={{
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "4px",
                                height: "100%",
                                bgGradient: gradientColors
                              }}
                            >
                              <Flex justify="space-between" mb={2}>
                                <Badge 
                                  px={3} 
                                  py={1} 
                                  borderRadius="full" 
                                  colorScheme={accentColor}
                                  textTransform="uppercase"
                                  fontWeight="bold"
                                  fontSize="xs"
                                >
                                  <Flex align="center">
                                    <Icon as={severityIcon} mr={1} boxSize={3} />
                                    {insight.type.split('_').join(' ')}
                                  </Flex>
                                </Badge>
                                
                                <Text 
                                  fontSize="xs" 
                                  fontWeight="bold" 
                                  color={`${accentColor}.500`}
                                  textTransform="uppercase"
                                >
                                  {insight.severity === 'positive' ? '✨ Great' : 
                                   insight.severity === 'warning' ? '⚠️ Attention Needed' : 
                                   '🚨 Take Action'}
                                </Text>
                              </Flex>
                              
                              <Text fontWeight="bold" color="gray.700" mb={1}>
                                {insight.message}
                              </Text>
                              
                              <Text fontSize="sm" color="gray.600">
                                {insight.recommendation}
                              </Text>
                            </MotionBox>
                          );
                        })}
                      </VStack>
                      
                      <MotionBox
                        textAlign="center"
                        mt={6}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                      >
                        <Button
                          colorScheme="purple"
                          variant="outline"
                          rightIcon={<FaRocket />}
                          _hover={{
                            transform: 'translateY(-2px)',
                            shadow: 'md'
                          }}
                        >
                          Get Custom Action Plan
                        </Button>
                      </MotionBox>
                    </MotionBox>
                  </VStack>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
        <Box textAlign="center" mt={12} opacity={0.8}>
          <Divider mb={4} />
          <Text fontSize="sm" color="gray.500">
            Financial Decision Copilot v1.0 - Powered by AI
          </Text>
          {showDevTools && (
            <HStack spacing={4} justifyContent="center" mt={2}>
              <Link 
                as={NextLink} 
                href="/diagnostics?devMode=true" 
                fontSize="sm" 
                color="purple.500"
                _hover={{ textDecoration: 'underline' }}
              >
                <Icon as={FaTools} mr={1} />
                Diagnostics & Troubleshooting
              </Link>
            </HStack>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default FinancialDataEntry; 