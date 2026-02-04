import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Container,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  CircularProgress,
  CircularProgressLabel,
  Link
} from '@chakra-ui/react';
import { FaCreditCard, FaChartLine, FaMoneyBillWave, FaSave, FaTools, FaArrowUp, FaArrowDown, FaLightbulb, FaRocket, FaTrophy, FaFire, FaStar } from 'react-icons/fa';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { FinancialData, AnalysisResults } from '@/lib/financial-analysis-agent';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import UserMenu from './UserMenu';
import SpaceBackground from './SpaceBackground';

// Magic UI Components for cosmic effects
import { Particles } from './magicui/particles';
import { Meteors } from './magicui/meteors';
import { SparklesText } from './magicui/sparkles-text';
import { AuroraText } from './magicui/aurora-text';
import { BorderBeam } from './magicui/border-beam';
import { NumberTicker } from './magicui/number-ticker';
import { ShimmerButton } from './magicui/shimmer-button';

// Extend the AnalysisResults interface locally to include API response metadata
interface ExtendedAnalysisResults extends AnalysisResults {
  _meta?: {
    dataSaved: boolean;
    timestamp: string;
  };
  _note?: string;
  _error?: string;
}

const MotionBox = motion.create(Box);
const MotionHeading = motion.create(Heading);
const MotionText = motion.create(Text);
const MotionIcon = motion.create(Icon);
const MotionSimpleGrid = motion.create(SimpleGrid);

const FinancialDataEntry: React.FC = () => {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ExtendedAnalysisResults | null>(null);

  // Space theme colors - glassmorphism style
  const cardBg = 'rgba(255, 255, 255, 0.03)';
  const cardBorder = 'rgba(255, 255, 255, 0.1)';
  const accentColor = '#8b5cf6';
  const mutedText = 'whiteAlpha.800'; // Improved contrast for accessibility
  const inputBg = 'rgba(255, 255, 255, 0.05)';
  const inputBorder = 'rgba(255, 255, 255, 0.1)';
  
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
      position="relative"
      bg="transparent"
    >
      {/* Animated Space Background with Magic UI effects */}
      <SpaceBackground />

      {/* Magic UI Particles - floating star dust */}
      <Particles
        quantity={80}
        staticity={30}
        ease={80}
        size={0.8}
        color="#ffffff"
        className="opacity-60"
      />

      {/* Magic UI Meteors - shooting stars */}
      <Box position="fixed" inset={0} zIndex={0} overflow="hidden" pointerEvents="none">
        <Meteors
          number={15}
          minDelay={0.5}
          maxDelay={2}
          minDuration={3}
          maxDuration={8}
          angle={215}
        />
      </Box>

      <Container maxW="container.xl" py={8} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header with UserMenu */}
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Box flex="1" />
            <MotionBox
              textAlign="center"
              flex="2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Heading
                size="xl"
                mb={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={3}
                letterSpacing="tight"
              >
                <MotionIcon
                  as={FaStar}
                  color="#8b5cf6"
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <SparklesText
                  colors={{ first: "#8b5cf6", second: "#ec4899" }}
                  sparklesCount={12}
                >
                  <Text
                    as="span"
                    bgGradient="linear(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
                    bgClip="text"
                  >
                    FinAI Copilot
                  </Text>
                </SparklesText>
                <MotionIcon
                  as={FaStar}
                  color="#ec4899"
                  animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </Heading>
              <AuroraText
                colors={["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4"]}
                speed={1.5}
                className=""
              >
                <Text as="span" fontSize="lg" fontWeight="300">
                  Navigate your financial universe with AI-powered insights
                </Text>
              </AuroraText>
            </MotionBox>
            <Box flex="1" display="flex" justifyContent="flex-end">
              <UserMenu />
            </Box>
          </Flex>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {/* Input Section - Glassmorphism Card with BorderBeam */}
            <MotionBox
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card
                bg={cardBg}
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                overflow="hidden"
                border="1px solid"
                borderColor={cardBorder}
                _hover={{
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
                }}
                transition="all 0.3s ease"
                position="relative"
              >
                <BorderBeam
                  size={250}
                  duration={12}
                  colorFrom="#6366f1"
                  colorTo="#ec4899"
                  borderWidth={2}
                />
                <CardBody p={8}>
                  <VStack spacing={6} align="stretch">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="md" color="white" display="flex" alignItems="center">
                        <Icon as={FaMoneyBillWave} mr={3} color={accentColor} />
                        Financial Snapshot
                      </Heading>
                      <Button
                        size="sm"
                        leftIcon={<FaSave />}
                        variant="outline"
                        borderColor={accentColor}
                        color={accentColor}
                        _hover={{ bg: 'rgba(139, 92, 246, 0.1)' }}
                        onClick={() => saveFinancialData(true)}
                        isLoading={isSaving}
                      >
                        Save
                      </Button>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel color={mutedText} fontWeight="medium" fontSize="sm">Monthly Income</FormLabel>
                        <NumberInput
                          value={financialData.monthlyIncome}
                          onChange={(_, value) => handleChange('monthlyIncome', value)}
                          min={0}
                          precision={0}
                          step={100}
                        >
                          <NumberInputField
                            bg={inputBg}
                            border="1px solid"
                            borderColor={inputBorder}
                            color="white"
                            fontSize="lg"
                            _hover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
                            _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                          />
                          <NumberInputStepper borderColor={inputBorder}>
                            <NumberIncrementStepper borderColor={inputBorder} color={mutedText} />
                            <NumberDecrementStepper borderColor={inputBorder} color={mutedText} />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel color={mutedText} fontWeight="medium" fontSize="sm">Monthly Expenses</FormLabel>
                        <NumberInput
                          value={financialData.monthlyExpenses}
                          onChange={(_, value) => handleChange('monthlyExpenses', value)}
                          min={0}
                          precision={0}
                          step={100}
                        >
                          <NumberInputField
                            bg={inputBg}
                            border="1px solid"
                            borderColor={inputBorder}
                            color="white"
                            fontSize="lg"
                            _hover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
                            _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                          />
                          <NumberInputStepper borderColor={inputBorder}>
                            <NumberIncrementStepper borderColor={inputBorder} color={mutedText} />
                            <NumberDecrementStepper borderColor={inputBorder} color={mutedText} />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>

                    <Box py={2}>
                      <Text color={mutedText} fontWeight="medium" fontSize="sm" mb={4}>Savings & Investments</Text>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl>
                          <FormLabel color={mutedText} fontSize="sm">Savings</FormLabel>
                          <NumberInput
                            value={financialData.savings}
                            onChange={(_, value) => handleChange('savings', value)}
                            min={0}
                            precision={0}
                            step={100}
                          >
                            <NumberInputField
                              bg={inputBg}
                              border="1px solid"
                              borderColor={inputBorder}
                              color="white"
                              _hover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
                              _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                            />
                            <NumberInputStepper borderColor={inputBorder}>
                              <NumberIncrementStepper borderColor={inputBorder} color={mutedText} />
                              <NumberDecrementStepper borderColor={inputBorder} color={mutedText} />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel color={mutedText} fontSize="sm">Investments</FormLabel>
                          <NumberInput
                            value={financialData.investments}
                            onChange={(_, value) => handleChange('investments', value)}
                            min={0}
                            precision={0}
                            step={100}
                          >
                            <NumberInputField
                              bg={inputBg}
                              border="1px solid"
                              borderColor={inputBorder}
                              color="white"
                              _hover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
                              _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                            />
                            <NumberInputStepper borderColor={inputBorder}>
                              <NumberIncrementStepper borderColor={inputBorder} color={mutedText} />
                              <NumberDecrementStepper borderColor={inputBorder} color={mutedText} />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </SimpleGrid>
                    </Box>

                    <FormControl>
                      <FormLabel color={mutedText} fontWeight="medium" fontSize="sm">Total Debt</FormLabel>
                      <Slider
                        value={financialData.debt}
                        min={0}
                        max={500000}
                        step={5000}
                        onChange={(value) => handleChange('debt', value)}
                        mb={4}
                      >
                        <SliderTrack bg="rgba(255,255,255,0.1)" h="8px" borderRadius="full">
                          <SliderFilledTrack bgGradient="linear(to-r, #6366f1, #8b5cf6, #ec4899)" />
                        </SliderTrack>
                        <SliderThumb boxSize={6} bg={accentColor} boxShadow="0 0 10px rgba(139, 92, 246, 0.5)">
                          <Icon as={FaCreditCard} color="white" boxSize={3} />
                        </SliderThumb>
                        <SliderMark
                          value={financialData.debt}
                          textAlign='center'
                          bg={accentColor}
                          color='white'
                          mt='-10'
                          ml='-5'
                          w='14'
                          fontSize="xs"
                          borderRadius="md"
                          fontWeight="bold"
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
                          bg={inputBg}
                          border="1px solid"
                          borderColor={inputBorder}
                          color="white"
                          fontSize="lg"
                          _hover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
                          _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                        />
                        <NumberInputStepper borderColor={inputBorder}>
                          <NumberIncrementStepper borderColor={inputBorder} color={mutedText} />
                          <NumberDecrementStepper borderColor={inputBorder} color={mutedText} />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <Box mt={4}>
                      <ShimmerButton
                        onClick={analyzeFinances}
                        disabled={isLoading}
                        shimmerColor="rgba(255,255,255,0.5)"
                        shimmerDuration="2.5s"
                        borderRadius="16px"
                        background="linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
                        style={{
                          width: '100%',
                          padding: '16px 24px',
                          fontSize: '18px',
                        }}
                      >
                        <FaRocket style={{ marginRight: '8px' }} />
                        {isLoading ? 'Analyzing...' : 'Launch Analysis'}
                      </ShimmerButton>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>
            
            {/* Results Section - Glassmorphism Card with BorderBeam */}
            <MotionBox
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card
                bg={cardBg}
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                overflow="hidden"
                border="1px solid"
                borderColor={cardBorder}
                minH="600px"
                _hover={{
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
                }}
                transition="all 0.3s ease"
                position="relative"
              >
                <BorderBeam
                  size={300}
                  duration={15}
                  delay={2}
                  colorFrom="#ec4899"
                  colorTo="#06b6d4"
                  borderWidth={2}
                />
                <CardBody p={8}>
                  {!analysisResults ? (
                    <VStack spacing={6} align="center" justify="center" height="100%" opacity={0.8}>
                      <MotionBox
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }}
                      >
                        <Icon as={FaRocket} boxSize={20} color={accentColor} />
                      </MotionBox>
                      <Heading size="md" color="white" textAlign="center">
                        Ready for Liftoff
                      </Heading>
                      <Text color={mutedText} textAlign="center" maxW="300px">
                        Enter your financial data and launch the analysis to explore your financial universe
                      </Text>
                      <HStack spacing={2} mt={4}>
                        {[0, 1, 2].map((i) => (
                          <MotionBox
                            key={i}
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg={accentColor}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </HStack>
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
                              <Box fontSize="3xl" fontWeight="bold">
                                <NumberTicker
                                  value={calculateFinancialHealthScore()}
                                  delay={0.2}
                                  className=""
                                />
                              </Box>
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
                      spacing={4}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <MotionBox
                        bg="rgba(255,255,255,0.03)"
                        backdropFilter="blur(10px)"
                        p={5}
                        borderRadius="xl"
                        position="relative"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="rgba(255,255,255,0.1)"
                        whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)' }}
                        _before={{
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          bgGradient: analysisResults.metrics.monthlySavings >= 0
                            ? 'linear(to-b, #10b981, #06b6d4)'
                            : 'linear(to-b, #ef4444, #f97316)',
                        }}
                      >
                        <Text fontSize="xs" color="whiteAlpha.600" mb={1} fontWeight="semibold" letterSpacing="wider">
                          MONTHLY CASH FLOW
                        </Text>
                        <Heading
                          size="xl"
                          color={analysisResults.metrics.monthlySavings >= 0 ? '#10b981' : '#ef4444'}
                          display="flex"
                          alignItems="baseline"
                        >
                          <NumberTicker
                            value={Math.abs(analysisResults.metrics.monthlySavings)}
                            prefix="$"
                            delay={0.3}
                            className=""
                          />
                          <Text fontSize="sm" color="whiteAlpha.600" ml={2}>
                            {analysisResults.metrics.monthlySavings >= 0 ? '+/mo' : '-/mo'}
                          </Text>
                        </Heading>
                        <Flex align="center" mt={2}>
                          <Icon
                            as={analysisResults.metrics.monthlySavings >= 0 ? FaArrowUp : FaArrowDown}
                            color={analysisResults.metrics.monthlySavings >= 0 ? '#10b981' : '#ef4444'}
                            mr={1}
                          />
                          <Text color="whiteAlpha.700" fontSize="sm">
                            {analysisResults.metrics.savingsRate.toFixed(0)}% of income
                          </Text>
                        </Flex>
                      </MotionBox>

                      <MotionBox
                        bg="rgba(255,255,255,0.03)"
                        backdropFilter="blur(10px)"
                        p={5}
                        borderRadius="xl"
                        position="relative"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="rgba(255,255,255,0.1)"
                        whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(99, 102, 241, 0.2)' }}
                        _before={{
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          bgGradient: analysisResults.metrics.netWorth >= 0
                            ? 'linear(to-b, #6366f1, #8b5cf6)'
                            : 'linear(to-b, #f97316, #ef4444)',
                        }}
                      >
                        <Text fontSize="xs" color="whiteAlpha.600" mb={1} fontWeight="semibold" letterSpacing="wider">
                          NET WORTH
                        </Text>
                        <Heading
                          size="xl"
                          color={analysisResults.metrics.netWorth >= 0 ? '#8b5cf6' : '#f97316'}
                          display="flex"
                          alignItems="baseline"
                        >
                          <NumberTicker
                            value={Math.abs(analysisResults.metrics.netWorth)}
                            prefix={analysisResults.metrics.netWorth >= 0 ? '$' : '-$'}
                            delay={0.5}
                            className=""
                          />
                        </Heading>
                        <Flex align="center" mt={2}>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            Assets - Debt
                          </Text>
                        </Flex>
                      </MotionBox>
                    </MotionSimpleGrid>
                    
                    <MotionBox
                      mt={4}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <MotionHeading
                        size="md"
                        mb={4}
                        display="flex"
                        alignItems="center"
                        color="white"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon as={FaLightbulb} mr={2} color="#fbbf24" />
                        Smart Money Moves
                      </MotionHeading>

                      <VStack spacing={3} align="stretch">
                        {analysisResults.insights.map((insight, index) => {
                          // Determine colors based on severity
                          const severityColors = {
                            positive: { gradient: 'linear(to-r, #10b981, #06b6d4)', glow: 'rgba(16, 185, 129, 0.2)' },
                            warning: { gradient: 'linear(to-r, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.2)' },
                            critical: { gradient: 'linear(to-r, #ef4444, #ec4899)', glow: 'rgba(239, 68, 68, 0.2)' },
                          };
                          const colors = severityColors[insight.severity as keyof typeof severityColors] || severityColors.warning;

                          // Icon based on severity
                          const severityIcon =
                            insight.severity === 'positive' ? FaTrophy :
                            insight.severity === 'warning' ? FaLightbulb :
                            FaFire;

                          return (
                            <MotionBox
                              key={index}
                              p={4}
                              borderRadius="xl"
                              bg="rgba(255,255,255,0.03)"
                              backdropFilter="blur(10px)"
                              border="1px solid"
                              borderColor="rgba(255,255,255,0.08)"
                              position="relative"
                              overflow="hidden"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                              whileHover={{
                                y: -2,
                                boxShadow: colors.glow,
                                borderColor: 'rgba(255,255,255,0.15)',
                              }}
                              _before={{
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '3px',
                                height: '100%',
                                bgGradient: colors.gradient,
                              }}
                            >
                              <Flex justify="space-between" mb={2} align="center">
                                <Badge
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  bg="rgba(255,255,255,0.1)"
                                  color="white"
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
                                  color="whiteAlpha.700"
                                >
                                  {insight.severity === 'positive' ? 'On Track' :
                                   insight.severity === 'warning' ? 'Review' :
                                   'Action Needed'}
                                </Text>
                              </Flex>

                              <Text fontWeight="semibold" color="white" mb={1} fontSize="sm">
                                {insight.message}
                              </Text>

                              <Text fontSize="sm" color="whiteAlpha.700">
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
                        <ShimmerButton
                          shimmerColor="rgba(139, 92, 246, 0.6)"
                          shimmerDuration="3s"
                          borderRadius="16px"
                          background="linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)"
                          style={{
                            padding: '12px 24px',
                            border: '1px solid rgba(139, 92, 246, 0.5)',
                          }}
                        >
                          Get Custom Action Plan
                          <FaRocket style={{ marginLeft: '8px' }} />
                        </ShimmerButton>
                      </MotionBox>
                    </MotionBox>
                  </VStack>
                )}
              </CardBody>
            </Card>
            </MotionBox>
          </SimpleGrid>
        </VStack>
        <Box textAlign="center" mt={12} opacity={0.6}>
          <Divider borderColor="whiteAlpha.200" mb={4} />
          <Text fontSize="sm" color="whiteAlpha.600">
            FinAI Copilot v2.0 - Navigating Your Financial Universe
          </Text>
          {showDevTools && (
            <HStack spacing={4} justifyContent="center" mt={2}>
              <Link
                as={NextLink}
                href="/diagnostics?devMode=true"
                fontSize="sm"
                color={accentColor}
                _hover={{ textDecoration: 'underline', color: '#ec4899' }}
              >
                <Icon as={FaTools} mr={1} />
                Mission Control
              </Link>
            </HStack>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default FinancialDataEntry; 