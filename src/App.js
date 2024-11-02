import { ChakraProvider } from '@chakra-ui/react';
import ESQLComposerMain from './ui/ESQLComposerMain';

function App() {
  return (
    <ChakraProvider>
      <ESQLComposerMain />
    </ChakraProvider>
  );
}

export default App;