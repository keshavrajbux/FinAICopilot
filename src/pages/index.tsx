import React from 'react';
import { Box, Heading, Container, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
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
        <Box bg="blue.500" color="white" p={4} textAlign="center">
          <Heading size="md">Financial Decision Copilot</Heading>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" p={4}>
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>My Finances</Tab>
              <Tab>Data Connect</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <FinancialDataEntry />
              </TabPanel>
              <TabPanel>
                <Box textAlign="center" p={8}>
                  <Heading size="md">Data Connections</Heading>
                  <Box mt={4} p={4} bg="white" borderRadius="md" boxShadow="sm">
                    <p>Connect to financial data sources to enhance your analysis.</p>
                    <p>This feature will be available soon.</p>
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