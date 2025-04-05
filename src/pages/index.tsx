import React from 'react';
import { Box, Heading, Container, Tabs, TabList, TabPanels, Tab, TabPanel, Text } from '@chakra-ui/react';
import FinancialDataEntry from '@/components/FinancialDataEntry';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Financial Decision Copilot</title>
        <meta name="description" content="AI-powered financial analysis and decision-making tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box minH="100vh" bg="gray.50">
        {/* Header */}
        <Box 
          bg="purple.500" 
          color="white" 
          p={4} 
          textAlign="center"
          position="relative"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"%23FFFFFF\" opacity=\"0.1\"><text x=\"50\" y=\"50\" font-family=\"Arial\" font-size=\"60\" text-anchor=\"middle\" dominant-baseline=\"middle\">$</text></svg>')",
            backgroundRepeat: "repeat",
            backgroundSize: "50px",
            opacity: 0.1,
            zIndex: 0
          }}
        >
          <Heading size="md" position="relative" zIndex={1}>
            finAI agent <Text as="span" fontSize="xl">$$$</Text>
          </Heading>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" p={4}>
          <Tabs colorScheme="purple" variant="enclosed">
            <TabList>
              <Tab _selected={{ bg: 'purple.50', borderColor: 'purple.500' }}>My Finances</Tab>
              <Tab _selected={{ bg: 'purple.50', borderColor: 'purple.500' }}>Data Connect</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <FinancialDataEntry />
              </TabPanel>
              <TabPanel>
                <Box textAlign="center" p={8}>
                  <Heading size="md" color="purple.500">Data Connections</Heading>
                  <Box mt={4} p={4} bg="white" borderRadius="md" boxShadow="sm">
                    <Text color="purple.700">Connect to financial data sources to enhance your analysis.</Text>
                    <Text color="purple.600" mt={2}>This feature will be available soon.</Text>
                  </Box>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </>
  );
} 