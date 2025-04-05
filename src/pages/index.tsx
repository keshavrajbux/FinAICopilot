import React from 'react';
import { Box, Heading, Container, Tabs, TabList, TabPanels, Tab, TabPanel, Text, useColorModeValue } from '@chakra-ui/react';
import FinancialDataEntry from '@/components/FinancialDataEntry';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const bgColor = useColorModeValue('purple.50', 'gray.900');
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Financial Decision Copilot</title>
        <meta name="description" content="AI-powered financial analysis and decision-making tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box minH="100vh" bg={bgColor}>
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
              <Tab 
                onClick={() => router.push('/data-connect')}
                _selected={{ bg: 'purple.50', borderColor: 'purple.500' }}
                cursor="pointer"
              >
                Link Financial Accounts $$$
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <FinancialDataEntry />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </>
  );
} 