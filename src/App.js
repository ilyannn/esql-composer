import { ChakraProvider } from '@chakra-ui/react';
import Form from './components/Form';

function App() {
  return (
    <ChakraProvider>
      <Form />
    </ChakraProvider>
  );
}

export default App;