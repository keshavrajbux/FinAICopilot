import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  List,
  ListItem,
  ListIcon,
  Badge,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCheckCircle, FaExclamationTriangle, FaChartLine, FaPiggyBank } from 'react-icons/fa';

const AnalysisResults = ({ spendingAnalysis, investmentAnalysis, scenarioAnalysis }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const renderSpendingAnalysis = () => {
    if (!spendingAnalysis) return null;

    return (
      <Card bg={bgColor} borderColor={borderColor}>
        <CardBody>
          <Heading size="md" mb={4}>Spending Analysis</Heading>
          <VStack spacing={4} align="stretch">
            {Object.entries(spendingAnalysis.categories).map(([category, data]) => (
              <Box key={category}>
                <Text fontWeight="bold">{category}</Text>
                <Progress value={data.percentage} colorScheme="blue" size="sm" mb={2} />
                <Text>Total: ${data.total.toFixed(2)}</Text>
              </Box>
            ))}
            <Box mt={4}>
              <Heading size="sm" mb={2}>Recommendations</Heading>
              <List spacing={2}>
                {spendingAnalysis.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    {rec.description} (Potential savings: ${rec.potentialSavings})
                  </ListItem>
                ))}
              </List>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const renderInvestmentAnalysis = () => {
    if (!investmentAnalysis) return null;

    return (
      <Card bg={bgColor} borderColor={borderColor}>
        <CardBody>
          <Heading size="md" mb={4}>Investment Analysis</Heading>
          <VStack spacing={4} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <Stat>
                  <StatLabel>Portfolio Value</StatLabel>
                  <StatNumber>${investmentAnalysis.portfolioAnalysis.totalValue.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                  </StatHelpText>
                </Stat>
              </GridItem>
              <GridItem>
                <Stat>
                  <StatLabel>Monthly Return</StatLabel>
                  <StatNumber>{(investmentAnalysis.portfolioAnalysis.performance.monthly * 100).toFixed(2)}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                  </StatHelpText>
                </Stat>
              </GridItem>
            </Grid>
            <Box mt={4}>
              <Heading size="sm" mb={2}>Recommendations</Heading>
              <List spacing={2}>
                {investmentAnalysis.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListIcon as={FaChartLine} color="blue.500" />
                    {rec.description}
                  </ListItem>
                ))}
              </List>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const renderScenarioAnalysis = () => {
    if (!scenarioAnalysis) return null;

    return (
      <Card bg={bgColor} borderColor={borderColor}>
        <CardBody>
          <Heading size="md" mb={4}>Scenario Analysis</Heading>
          <VStack spacing={4} align="stretch">
            {Object.entries(scenarioAnalysis.scenarios).map(([scenario, data]) => (
              <Box key={scenario} p={4} borderWidth="1px" borderRadius="md">
                <Heading size="sm" mb={2} textTransform="capitalize">{scenario}</Heading>
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <GridItem>
                    <Stat>
                      <StatLabel>Net Worth</StatLabel>
                      <StatNumber>${data.netWorth.toLocaleString()}</StatNumber>
                    </Stat>
                  </GridItem>
                  <GridItem>
                    <Stat>
                      <StatLabel>Monthly Cash Flow</StatLabel>
                      <StatNumber>${data.monthlyCashFlow.toLocaleString()}</StatNumber>
                    </Stat>
                  </GridItem>
                  <GridItem>
                    <Stat>
                      <StatLabel>Savings Rate</StatLabel>
                      <StatNumber>{(data.savingsRate * 100).toFixed(1)}%</StatNumber>
                    </Stat>
                  </GridItem>
                </Grid>
              </Box>
            ))}
            <Box mt={4}>
              <Heading size="sm" mb={2}>Recommendations</Heading>
              <List spacing={2}>
                {scenarioAnalysis.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListIcon as={FaPiggyBank} color="purple.500" />
                    {rec.description}
                  </ListItem>
                ))}
              </List>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      {renderSpendingAnalysis()}
      {renderInvestmentAnalysis()}
      {renderScenarioAnalysis()}
    </VStack>
  );
};

export default AnalysisResults; 