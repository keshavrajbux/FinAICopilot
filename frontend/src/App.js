import React from 'react';
import { ChakraProvider, Box, VStack, Heading, Text, Button, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, List, ListItem, ListIcon, HStack } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FaChartLine, FaWallet, FaChartBar, FaPlayCircle } from 'react-icons/fa';
import DemoMode from './components/DemoMode';

const App = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentView, setCurrentView] = React.useState('demo');

  const menuItems = [
    { id: 'demo', label: 'Demo Mode', icon: FaPlayCircle },
    { id: 'spending', label: 'Spending Analysis', icon: FaChartBar },
    { id: 'investment', label: 'Investment Tracking', icon: FaChartLine },
    { id: 'portfolio', label: 'Portfolio Management', icon: FaWallet },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'demo':
        return <DemoMode />;
      case 'spending':
        return <div>Spending Analysis</div>;
      case 'investment':
        return <div>Investment Tracking</div>;
      case 'portfolio':
        return <div>Portfolio Management</div>;
      default:
        return <DemoMode />;
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        {/* Header */}
        <Box bg="blue.500" color="white" p={4}>
          <HStack justify="space-between">
            <Button variant="ghost" color="white" onClick={onOpen}>
              <HamburgerIcon />
            </Button>
            <Heading size="md">Financial Decision Copilot</Heading>
            <Box w={8} /> {/* Spacer for alignment */}
          </HStack>
        </Box>

        {/* Main Content */}
        <Box p={4}>
          {renderContent()}
        </Box>

        {/* Navigation Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Menu</DrawerHeader>
            <DrawerBody>
              <List spacing={3}>
                {menuItems.map((item) => (
                  <ListItem key={item.id}>
                    <Button
                      w="100%"
                      justifyContent="flex-start"
                      variant={currentView === item.id ? 'solid' : 'ghost'}
                      onClick={() => {
                        setCurrentView(item.id);
                        onClose();
                      }}
                    >
                      <ListIcon as={item.icon} />
                      {item.label}
                    </Button>
                  </ListItem>
                ))}
              </List>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </ChakraProvider>
  );
};

export default App; 