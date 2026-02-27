import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Card,
  CardBody,
  Icon,
  Badge,
  Progress,
  Checkbox,
  useToast,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
} from '@chakra-ui/react';
import {
  FaChartLine,
  FaShieldAlt,
  FaBolt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaPlay,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FinancialData } from '@/lib/product';
import type {
  CashFlowForecast,
  ScenarioForecast,
  ForecastInsight,
} from '@/lib/product';
import { BorderBeam } from './magicui/border-beam';
import { NumberTicker } from './magicui/number-ticker';

const MotionBox = motion.create(Box);

// Scenario display config
const SCENARIO_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  baseline: {
    label: 'Current Path',
    color: '#8b5cf6',
    icon: FaChartLine,
    description: 'If nothing changes',
  },
  aggressive_saving: {
    label: 'Aggressive Saving',
    color: '#10b981',
    icon: FaArrowUp,
    description: '70% savings / 30% investments',
  },
  debt_avalanche: {
    label: 'Debt Avalanche',
    color: '#f59e0b',
    icon: FaBolt,
    description: 'All surplus toward debt',
  },
  income_disruption: {
    label: 'Job Loss Sim',
    color: '#ef4444',
    icon: FaExclamationTriangle,
    description: '3 months zero income',
  },
  income_boost: {
    label: 'Income Boost',
    color: '#06b6d4',
    icon: FaArrowUp,
    description: '+$1,000/mo side income',
  },
};

interface ForecastDashboardProps {
  financialData: FinancialData;
}

const ForecastDashboard: React.FC<ForecastDashboardProps> = ({ financialData }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'baseline',
    'aggressive_saving',
    'debt_avalanche',
  ]);
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);

  const cardBg = 'rgba(255, 255, 255, 0.03)';
  const cardBorder = 'rgba(255, 255, 255, 0.1)';
  const mutedText = 'whiteAlpha.800';

  const toggleScenario = (type: string) => {
    setSelectedScenarios((prev) => {
      if (prev.includes(type)) {
        if (prev.length <= 1) return prev; // Must keep at least one
        return prev.filter((s) => s !== type);
      }
      if (prev.length >= 4) return prev; // Max 4
      return [...prev, type];
    });
  };

  const runForecast = async () => {
    setIsLoading(true);
    try {
      const scenarios = selectedScenarios.map((type) => {
        if (type === 'income_disruption') {
          return { type, disruptionMonths: 3 };
        }
        if (type === 'income_boost') {
          return { type, additionalIncome: 1000 };
        }
        return { type };
      });

      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialData,
          horizonMonths,
          scenarios,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      setForecast(result.data);
      setActiveScenarioIdx(0);

      toast({
        title: 'Forecast Ready',
        description: `${horizonMonths}-month projection with ${scenarios.length} scenarios`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Forecast error:', error);
      toast({
        title: 'Forecast Error',
        description: 'Could not generate forecast. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStressColor = (score: number): string => {
    if (score <= 20) return '#10b981';
    if (score <= 40) return '#06b6d4';
    if (score <= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getUrgencyColor = (urgency: string): string => {
    if (urgency === 'high') return 'red';
    if (urgency === 'medium') return 'orange';
    return 'green';
  };

  const formatMoney = (n: number): string => {
    if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(0)}`;
  };

  const activeScenario: ScenarioForecast | null =
    forecast ? forecast.scenarios[activeScenarioIdx] ?? null : null;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card
        bg={cardBg}
        backdropFilter="blur(20px)"
        borderRadius="2xl"
        overflow="hidden"
        border="1px solid"
        borderColor={cardBorder}
        position="relative"
        _hover={{
          borderColor: 'rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
        }}
        transition="all 0.3s ease"
      >
        <BorderBeam
          size={300}
          duration={15}
          colorFrom="#06b6d4"
          colorTo="#8b5cf6"
          borderWidth={2}
        />
        <CardBody p={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md" color="white" display="flex" alignItems="center">
                <Icon as={FaChartLine} mr={3} color="#06b6d4" />
                Cash Flow Forecast
              </Heading>
              <Select
                w="130px"
                size="sm"
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(Number(e.target.value))}
                bg="rgba(255,255,255,0.05)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                color="white"
                _hover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
              >
                <option value={6} style={{ background: '#1a1a2e' }}>6 months</option>
                <option value={12} style={{ background: '#1a1a2e' }}>12 months</option>
                <option value={24} style={{ background: '#1a1a2e' }}>24 months</option>
                <option value={60} style={{ background: '#1a1a2e' }}>5 years</option>
              </Select>
            </Flex>

            {/* Scenario Selector */}
            <Box>
              <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" mb={3} letterSpacing="wider">
                SELECT SCENARIOS TO COMPARE
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={3}>
                {Object.entries(SCENARIO_CONFIG).map(([type, cfg]) => {
                  const isSelected = selectedScenarios.includes(type);
                  return (
                    <MotionBox
                      key={type}
                      p={3}
                      borderRadius="xl"
                      bg={isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'}
                      border="1px solid"
                      borderColor={isSelected ? cfg.color : 'rgba(255,255,255,0.05)'}
                      cursor="pointer"
                      onClick={() => toggleScenario(type)}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      opacity={isSelected ? 1 : 0.6}
                    >
                      <Flex align="center" mb={1}>
                        <Checkbox
                          isChecked={isSelected}
                          onChange={() => toggleScenario(type)}
                          colorScheme="purple"
                          size="sm"
                          mr={2}
                          pointerEvents="none"
                        />
                        <Icon as={cfg.icon} color={cfg.color} boxSize={3} />
                      </Flex>
                      <Text fontSize="xs" color="white" fontWeight="semibold">
                        {cfg.label}
                      </Text>
                      <Text fontSize="10px" color="whiteAlpha.500">
                        {cfg.description}
                      </Text>
                    </MotionBox>
                  );
                })}
              </SimpleGrid>
            </Box>

            {/* Run Button */}
            <Button
              onClick={runForecast}
              isLoading={isLoading}
              loadingText="Projecting..."
              leftIcon={<FaPlay />}
              bgGradient="linear(135deg, #06b6d4, #8b5cf6)"
              color="white"
              size="lg"
              borderRadius="xl"
              _hover={{ opacity: 0.9 }}
            >
              Run {horizonMonths}-Month Forecast
            </Button>

            {/* Results */}
            {forecast && activeScenario && (
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Scenario Tabs */}
                {forecast.scenarios.length > 1 && (
                  <HStack spacing={2} mb={6} overflowX="auto" pb={2}>
                    {forecast.scenarios.map((s, i) => {
                      const cfg = SCENARIO_CONFIG[s.scenario.type] || SCENARIO_CONFIG.baseline;
                      return (
                        <Button
                          key={i}
                          size="sm"
                          variant={i === activeScenarioIdx ? 'solid' : 'outline'}
                          bg={i === activeScenarioIdx ? cfg.color : 'transparent'}
                          borderColor={cfg.color}
                          color="white"
                          _hover={{ bg: cfg.color, opacity: 0.8 }}
                          onClick={() => setActiveScenarioIdx(i)}
                          flexShrink={0}
                        >
                          {cfg.label}
                        </Button>
                      );
                    })}
                  </HStack>
                )}

                {/* Key Metrics Row */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                  {/* Stress Score */}
                  <Box
                    p={4}
                    borderRadius="xl"
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.08)"
                  >
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" letterSpacing="wider" mb={2}>
                      STRESS SCORE
                    </Text>
                    <Flex align="center" mb={2}>
                      <Icon as={FaShieldAlt} color={getStressColor(activeScenario.summary.stressScore)} mr={2} />
                      <Text fontSize="2xl" fontWeight="bold" color={getStressColor(activeScenario.summary.stressScore)}>
                        {activeScenario.summary.stressScore}
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.500" ml={1}>/100</Text>
                    </Flex>
                    <Progress
                      value={activeScenario.summary.stressScore}
                      size="xs"
                      borderRadius="full"
                      bg="rgba(255,255,255,0.1)"
                      sx={{
                        '& > div': {
                          bg: getStressColor(activeScenario.summary.stressScore),
                        },
                      }}
                    />
                  </Box>

                  {/* Runway */}
                  <Box
                    p={4}
                    borderRadius="xl"
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.08)"
                  >
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" letterSpacing="wider" mb={2}>
                      RUNWAY
                    </Text>
                    <Flex align="baseline">
                      <Text fontSize="2xl" fontWeight="bold" color="#06b6d4">
                        {activeScenario.summary.runwayMonths}
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.500" ml={1}>months</Text>
                    </Flex>
                    <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
                      if income stops today
                    </Text>
                  </Box>

                  {/* Debt-Free */}
                  <Box
                    p={4}
                    borderRadius="xl"
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.08)"
                  >
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" letterSpacing="wider" mb={2}>
                      DEBT-FREE IN
                    </Text>
                    <Flex align="baseline">
                      <Icon as={FaClock} color="#f59e0b" mr={2} />
                      <Text fontSize="2xl" fontWeight="bold" color="#f59e0b">
                        {activeScenario.summary.monthsToDebtFree ?? '---'}
                      </Text>
                      {activeScenario.summary.monthsToDebtFree !== null && (
                        <Text fontSize="sm" color="whiteAlpha.500" ml={1}>months</Text>
                      )}
                    </Flex>
                    {activeScenario.summary.monthsToDebtFree === null && financialData.debt > 0 && (
                      <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
                        beyond {horizonMonths}mo horizon
                      </Text>
                    )}
                  </Box>

                  {/* Net Worth Delta */}
                  <Box
                    p={4}
                    borderRadius="xl"
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.08)"
                  >
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" letterSpacing="wider" mb={2}>
                      NET WORTH CHANGE
                    </Text>
                    <Flex align="center">
                      <Icon
                        as={activeScenario.summary.netWorthDelta >= 0 ? FaArrowUp : FaArrowDown}
                        color={activeScenario.summary.netWorthDelta >= 0 ? '#10b981' : '#ef4444'}
                        mr={2}
                      />
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={activeScenario.summary.netWorthDelta >= 0 ? '#10b981' : '#ef4444'}
                      >
                        {formatMoney(Math.abs(activeScenario.summary.netWorthDelta))}
                      </Text>
                    </Flex>
                    <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
                      over {horizonMonths} months
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Interest & Returns Summary */}
                <SimpleGrid columns={3} spacing={4} mb={6}>
                  <Tooltip label="Total interest you'll pay on your debt">
                    <Box p={3} borderRadius="lg" bg="rgba(239,68,68,0.08)" border="1px solid rgba(239,68,68,0.15)" textAlign="center">
                      <Text fontSize="xs" color="#ef4444" fontWeight="semibold">Debt Interest</Text>
                      <Text fontSize="lg" fontWeight="bold" color="#ef4444">
                        -{formatMoney(activeScenario.summary.totalDebtInterestPaid)}
                      </Text>
                    </Box>
                  </Tooltip>
                  <Tooltip label="Returns earned from your investments">
                    <Box p={3} borderRadius="lg" bg="rgba(16,185,129,0.08)" border="1px solid rgba(16,185,129,0.15)" textAlign="center">
                      <Text fontSize="xs" color="#10b981" fontWeight="semibold">Investment Returns</Text>
                      <Text fontSize="lg" fontWeight="bold" color="#10b981">
                        +{formatMoney(activeScenario.summary.totalInvestmentReturns)}
                      </Text>
                    </Box>
                  </Tooltip>
                  <Tooltip label="Interest earned from high-yield savings">
                    <Box p={3} borderRadius="lg" bg="rgba(6,182,212,0.08)" border="1px solid rgba(6,182,212,0.15)" textAlign="center">
                      <Text fontSize="xs" color="#06b6d4" fontWeight="semibold">Savings Interest</Text>
                      <Text fontSize="lg" fontWeight="bold" color="#06b6d4">
                        +{formatMoney(activeScenario.summary.totalSavingsInterest)}
                      </Text>
                    </Box>
                  </Tooltip>
                </SimpleGrid>

                {/* Scenario Comparison Table */}
                {forecast.scenarios.length > 1 && (
                  <Box mb={6}>
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" mb={3} letterSpacing="wider">
                      SCENARIO COMPARISON
                    </Text>
                    <TableContainer>
                      <Table variant="unstyled" size="sm">
                        <Thead>
                          <Tr borderBottom="1px solid rgba(255,255,255,0.1)">
                            <Th color="whiteAlpha.600" fontSize="xs" pl={0}>Scenario</Th>
                            <Th color="whiteAlpha.600" fontSize="xs" isNumeric>End Net Worth</Th>
                            <Th color="whiteAlpha.600" fontSize="xs" isNumeric>NW Change</Th>
                            <Th color="whiteAlpha.600" fontSize="xs" isNumeric>Debt-Free</Th>
                            <Th color="whiteAlpha.600" fontSize="xs" isNumeric>Stress</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {forecast.scenarios.map((s, i) => {
                            const cfg = SCENARIO_CONFIG[s.scenario.type] || SCENARIO_CONFIG.baseline;
                            const isBest = forecast.scenarios.every(
                              (other) => s.summary.endNetWorth >= other.summary.endNetWorth
                            );
                            return (
                              <Tr
                                key={i}
                                borderBottom="1px solid rgba(255,255,255,0.05)"
                                bg={i === activeScenarioIdx ? 'rgba(255,255,255,0.05)' : 'transparent'}
                                cursor="pointer"
                                onClick={() => setActiveScenarioIdx(i)}
                                _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                              >
                                <Td pl={0}>
                                  <Flex align="center">
                                    <Box w="8px" h="8px" borderRadius="full" bg={cfg.color} mr={2} />
                                    <Text color="white" fontSize="sm">{cfg.label}</Text>
                                    {isBest && (
                                      <Badge ml={2} colorScheme="green" fontSize="9px" variant="subtle">
                                        BEST
                                      </Badge>
                                    )}
                                  </Flex>
                                </Td>
                                <Td isNumeric>
                                  <Text color="white" fontWeight="semibold">
                                    {formatMoney(s.summary.endNetWorth)}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text color={s.summary.netWorthDelta >= 0 ? '#10b981' : '#ef4444'} fontWeight="semibold">
                                    {s.summary.netWorthDelta >= 0 ? '+' : ''}{formatMoney(s.summary.netWorthDelta)}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text color="whiteAlpha.800">
                                    {s.summary.monthsToDebtFree ? `${s.summary.monthsToDebtFree}mo` : '---'}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text color={getStressColor(s.summary.stressScore)} fontWeight="semibold">
                                    {s.summary.stressScore}
                                  </Text>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Monthly Projection Timeline (Key Months) */}
                <Box mb={6}>
                  <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" mb={3} letterSpacing="wider">
                    NET WORTH TRAJECTORY
                  </Text>
                  <Flex align="flex-end" h="120px" gap={1}>
                    {activeScenario.projections.map((p, i) => {
                      // Show every month for small horizons, sample for large
                      const totalMonths = activeScenario.projections.length;
                      const showEvery = totalMonths <= 12 ? 1 : totalMonths <= 24 ? 2 : 4;
                      if (i % showEvery !== 0 && i !== totalMonths - 1) return null;

                      const allNW = activeScenario.projections.map((pr) => pr.netWorth);
                      const maxNW = Math.max(...allNW, 1);
                      const minNW = Math.min(...allNW, 0);
                      const range = maxNW - minNW || 1;
                      const normalized = ((p.netWorth - minNW) / range) * 100;
                      const barHeight = Math.max(4, normalized);

                      const cfg = SCENARIO_CONFIG[activeScenario.scenario.type] || SCENARIO_CONFIG.baseline;

                      return (
                        <Tooltip
                          key={i}
                          label={`Month ${p.month}: NW ${formatMoney(p.netWorth)} | Savings ${formatMoney(p.savingsBalance)} | Debt ${formatMoney(p.debtBalance)}`}
                          fontSize="xs"
                        >
                          <Box
                            flex={1}
                            h={`${barHeight}%`}
                            minH="4px"
                            bg={p.netWorth >= 0 ? cfg.color : '#ef4444'}
                            opacity={i === activeScenario.projections.length - 1 ? 1 : 0.6}
                            borderRadius="sm"
                            cursor="pointer"
                            _hover={{ opacity: 1 }}
                            transition="opacity 0.2s"
                          />
                        </Tooltip>
                      );
                    })}
                  </Flex>
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="xs" color="whiteAlpha.400">Month 1</Text>
                    <Text fontSize="xs" color="whiteAlpha.400">Month {horizonMonths}</Text>
                  </Flex>
                </Box>

                {/* AI Insights */}
                {forecast.insights.length > 0 && (
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold" mb={3} letterSpacing="wider">
                      AI INSIGHTS
                    </Text>
                    <VStack spacing={3} align="stretch">
                      {forecast.insights.map((insight, i) => (
                        <MotionBox
                          key={i}
                          p={4}
                          borderRadius="xl"
                          bg="rgba(255,255,255,0.03)"
                          border="1px solid rgba(255,255,255,0.08)"
                          position="relative"
                          overflow="hidden"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '3px',
                            height: '100%',
                            bg: insight.urgency === 'high' ? '#ef4444' :
                                insight.urgency === 'medium' ? '#f59e0b' : '#10b981',
                          }}
                        >
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontWeight="bold" color="white" fontSize="sm">
                              {insight.headline}
                            </Text>
                            <Badge
                              colorScheme={getUrgencyColor(insight.urgency)}
                              fontSize="9px"
                              variant="subtle"
                            >
                              {insight.urgency}
                            </Badge>
                          </Flex>
                          <Text fontSize="sm" color="whiteAlpha.700" mb={2}>
                            {insight.explanation}
                          </Text>
                          <Flex align="center">
                            <Icon as={FaCheckCircle} color="#8b5cf6" boxSize={3} mr={2} />
                            <Text fontSize="xs" color="#8b5cf6" fontWeight="semibold">
                              {insight.actionItem}
                            </Text>
                          </Flex>
                        </MotionBox>
                      ))}
                    </VStack>
                  </Box>
                )}
              </MotionBox>
            )}
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  );
};

export default ForecastDashboard;
