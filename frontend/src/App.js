import React from 'react';
import { ChakraProvider, Box, Heading, Container, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import DataConnector from './components/DataConnector';
import FinancialDataEntry from './components/FinancialDataEntry';

const App = () => {
  return (
    <ChakraProvider>
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
                <DataConnector />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default App; 