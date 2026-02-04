import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider } from '@/lib/auth-context';

// Define the space-themed color palette
const theme = extendTheme({
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    space: {
      900: '#050510',
      800: '#0a0a18',
      700: '#0d0d20',
      600: '#0a0a1a',
      500: '#1a1a2e',
      400: '#16213e',
      300: '#1f4068',
      200: '#1b1b3a',
      100: '#2d2d5a',
    },
    cosmic: {
      purple: '#8b5cf6',
      blue: '#6366f1',
      pink: '#ec4899',
      cyan: '#06b6d4',
      emerald: '#10b981',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'transparent',
        color: 'white',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'xl',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    Button: {
      variants: {
        cosmic: {
          bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          color: 'white',
          _hover: {
            bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ChakraProvider>
  );
}
