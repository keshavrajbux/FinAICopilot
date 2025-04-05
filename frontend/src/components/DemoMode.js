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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';

const DemoMode = () => {
  const [demoScenario, setDemoScenario] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const toast = useToast();

  const scenarios = {
    default: {
      name: 'Default Scenario',
      description: 'A balanced financial profile with moderate spending and saving habits.',
      income: 5000,
      expenses: 3000,
      savings: 2000
    },
    conservative: {
      name: 'Conservative Saver',
      description: 'A conservative financial profile with high savings and low risk investments.',
      income: 4500,
      expenses: 2000,
      savings: 2500
    },
    aggressive: {
      name: 'Aggressive Investor',
      description: 'An aggressive financial profile with high-risk investments and variable spending.',
      income: 6000,
      expenses: 4000,
      savings: 2000
    },
  };

  const handleScenarioChange = (event) => {
    setDemoScenario(event.target.value);
    setAnalysisResults(null);
  };

  const startDemo = async () => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const scenario = scenarios[demoScenario];
      
      // Generate simple analysis results
      setAnalysisResults({
        spendingAnalysis: {
          categories: {
            Housing: { percentage: 35, amount: scenario.expenses * 0.35 },
            Food: { percentage: 20, amount: scenario.expenses * 0.2 },
            Transportation: { percentage: 15, amount: scenario.expenses * 0.15 },
            Entertainment: { percentage: 10, amount: scenario.expenses * 0.1 },
            Other: { percentage: 20, amount: scenario.expenses * 0.2 },
          },
          recommendations: [
            "Consider meal planning to reduce food expenses",
            "Look for entertainment subscription bundles",
            "Track transportation costs and consider carpooling"
          ]
        },
        investmentAnalysis: {
          totalValue: scenario.savings * 12 * 5, // 5 years of savings
          returnRate: demoScenario === 'aggressive' ? 0.08 : demoScenario === 'conservative' ? 0.04 : 0.06,
          riskLevel: demoScenario === 'aggressive' ? 'High' : demoScenario === 'conservative' ? 'Low' : 'Medium',
          recommendations: [
            "Maintain emergency fund of 3-6 months expenses",
            "Consider dollar cost averaging for stock investments",
            demoScenario === 'aggressive' ? "Diversify to reduce risk" : "Increase stock allocation for higher returns"
          ]
        }
      });
      
      setIsLoading(false);
      toast({
        title: 'Analysis Complete',
        description: 'Financial analysis has been generated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 2000);
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Financial Decision Copilot</Heading>
          <Text color="gray.600">
            Test the Financial Decision Copilot with simulated data. No real financial information required.
          </Text>
        </Box>

        <Card>
          <CardBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Select Financial Profile</FormLabel>
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

              <SimpleGrid columns={3} spacing={4} width="100%">
                <Stat>
                  <StatLabel>Monthly Income</StatLabel>
                  <StatNumber>${scenarios[demoScenario].income}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Monthly Expenses</StatLabel>
                  <StatNumber>${scenarios[demoScenario].expenses}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Monthly Savings</StatLabel>
                  <StatNumber>${scenarios[demoScenario].savings}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                  </StatHelpText>
                </Stat>
              </SimpleGrid>

              <Button 
                colorScheme="blue" 
                size="lg" 
                width="100%" 
                onClick={startDemo}
                isLoading={isLoading}
              >
                Run Financial Analysis
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {isLoading && (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Analyzing your financial profile...</Text>
          </Box>
        )}

        {analysisResults && (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Analysis Results</Heading>
            
            <Card>
              <CardBody>
                <Heading size="sm" mb={4}>Spending Analysis</Heading>
                <Text fontWeight="bold">Category Breakdown:</Text>
                <SimpleGrid columns={2} spacing={4} mt={2}>
                  {Object.entries(analysisResults.spendingAnalysis.categories).map(([category, data]) => (
                    <Box key={category}>
                      <Text>{category}: {data.percentage}%</Text>
                      <Text fontSize="sm" color="gray.600">${data.amount.toFixed(2)}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
                
                <Text fontWeight="bold" mt={4}>Recommendations:</Text>
                <VStack align="start" mt={2}>
                  {analysisResults.spendingAnalysis.recommendations.map((rec, index) => (
                    <Text key={index}>• {rec}</Text>
                  ))}
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading size="sm" mb={4}>Investment Analysis</Heading>
                <SimpleGrid columns={3} spacing={4}>
                  <Stat>
                    <StatLabel>Portfolio Value</StatLabel>
                    <StatNumber>${analysisResults.investmentAnalysis.totalValue}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Projected Return</StatLabel>
                    <StatNumber>{(analysisResults.investmentAnalysis.returnRate * 100).toFixed(1)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Risk Level</StatLabel>
                    <StatNumber>{analysisResults.investmentAnalysis.riskLevel}</StatNumber>
                  </Stat>
                </SimpleGrid>
                
                <Text fontWeight="bold" mt={4}>Recommendations:</Text>
                <VStack align="start" mt={2}>
                  {analysisResults.investmentAnalysis.recommendations.map((rec, index) => (
                    <Text key={index}>• {rec}</Text>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default DemoMode; 