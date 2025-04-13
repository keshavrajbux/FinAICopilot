import React, { useState } from 'react';
import {
  Box, Button, VStack, Heading, Text, Badge, Alert, AlertIcon,
  AlertTitle, AlertDescription, Code, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon, Spinner, List,
  ListItem, ListIcon, Divider, useToast
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

interface DbTestResults {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
    SUPABASE_SERVICE_ROLE_KEY: boolean;
    ANTHROPIC_API_KEY: boolean;
    OPENAI_API_KEY: boolean;
  };
  clientAvailable: boolean;
  clientType: string;
  databaseConnection: boolean;
  connectionError?: string;
  tables: {
    financial_data: boolean;
    financial_analyses: boolean;
    financial_data_error?: string;
    financial_analyses_error?: string;
    financial_data_count?: number;
    financial_analyses_count?: number;
  };
  test_insert: {
    attempted: boolean;
    success: boolean;
    error: string | null;
    cleanup?: boolean;
  };
  timestamp: string;
  suggestions: string[];
}

const DatabaseTester: React.FC = () => {
  const [results, setResults] = useState<DbTestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const testDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/db-test');
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
      
      // Show toast based on results
      if (data.databaseConnection && data.tables.financial_data && data.tables.financial_analyses) {
        toast({
          title: "Database Connection Success",
          description: "Your database is configured correctly!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Database Configuration Issues",
          description: "There are some issues with your database setup. See the detailed results.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: "Test Failed",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (status: boolean) => status ? "green" : "red";

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Database Connection Tester</Heading>
        <Text>
          Use this tool to check if your database is configured correctly for the Financial Decision Copilot.
        </Text>
        
        <Button 
          colorScheme="blue" 
          onClick={testDatabase} 
          isLoading={loading}
          loadingText="Testing connection..."
        >
          Test Database Connection
        </Button>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error:</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {results && (
          <VStack spacing={4} align="stretch" mt={4}>
            <Box>
              <Alert 
                status={results.databaseConnection ? "success" : "error"}
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="md"
                p={4}
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  {results.databaseConnection 
                    ? "Database Connection Successful" 
                    : "Database Connection Failed"}
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  {results.databaseConnection 
                    ? "Your Supabase database connection is working." 
                    : "Unable to connect to your Supabase database."}
                </AlertDescription>
              </Alert>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={2}>Environment Variables</Heading>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Badge colorScheme={getBadgeColor(results.env.NEXT_PUBLIC_SUPABASE_URL)}>
                  SUPABASE_URL: {results.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗"}
                </Badge>
                <Badge colorScheme={getBadgeColor(results.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}>
                  SUPABASE_ANON_KEY: {results.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗"}
                </Badge>
                <Badge colorScheme={getBadgeColor(results.env.SUPABASE_SERVICE_ROLE_KEY)}>
                  SERVICE_ROLE_KEY: {results.env.SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗"}
                </Badge>
                <Badge colorScheme={getBadgeColor(results.env.ANTHROPIC_API_KEY)}>
                  CLAUDE API: {results.env.ANTHROPIC_API_KEY ? "✓" : "✗"}
                </Badge>
                <Badge colorScheme={getBadgeColor(results.env.OPENAI_API_KEY)}>
                  OPENAI API: {results.env.OPENAI_API_KEY ? "✓" : "✗"}
                </Badge>
              </Box>
            </Box>
            
            <Box>
              <Heading size="sm" mb={2}>Database Tables</Heading>
              <VStack align="stretch" spacing={2}>
                <Box p={2} bg={results.tables.financial_data ? "green.50" : "red.50"} borderRadius="md">
                  <Text fontWeight="bold">
                    financial_data: {results.tables.financial_data ? "Exists" : "Missing"}
                    {results.tables.financial_data_count !== undefined && ` (${results.tables.financial_data_count} rows)`}
                  </Text>
                  {results.tables.financial_data_error && (
                    <Text fontSize="sm" color="red.600">{results.tables.financial_data_error}</Text>
                  )}
                </Box>
                
                <Box p={2} bg={results.tables.financial_analyses ? "green.50" : "red.50"} borderRadius="md">
                  <Text fontWeight="bold">
                    financial_analyses: {results.tables.financial_analyses ? "Exists" : "Missing"}
                    {results.tables.financial_analyses_count !== undefined && ` (${results.tables.financial_analyses_count} rows)`}
                  </Text>
                  {results.tables.financial_analyses_error && (
                    <Text fontSize="sm" color="red.600">{results.tables.financial_analyses_error}</Text>
                  )}
                </Box>
              </VStack>
            </Box>
            
            {results.test_insert.attempted && (
              <Box>
                <Heading size="sm" mb={2}>Test Insert</Heading>
                <Alert status={results.test_insert.success ? "success" : "error"} borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>{results.test_insert.success ? "Insert Successful" : "Insert Failed"}</AlertTitle>
                    <AlertDescription>
                      {results.test_insert.success 
                        ? "Successfully inserted and removed test data."
                        : `Error: ${results.test_insert.error}`}
                    </AlertDescription>
                  </Box>
                </Alert>
              </Box>
            )}
            
            {results.suggestions.length > 0 && (
              <Box>
                <Heading size="sm" mb={2}>Suggestions</Heading>
                <List spacing={2}>
                  {results.suggestions.map((suggestion, index) => (
                    <ListItem key={index} display="flex" alignItems="center">
                      <ListIcon as={InfoIcon} color="blue.500" />
                      <Text>{suggestion}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Accordion allowToggle>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Raw Test Results
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} bg="gray.50" borderRadius="md">
                  <Code display="block" whiteSpace="pre" overflowX="auto" p={2}>
                    {JSON.stringify(results, null, 2)}
                  </Code>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default DatabaseTester; 