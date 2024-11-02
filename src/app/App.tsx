import { ChakraProvider } from "@chakra-ui/react";
import React from "react";

import ESQLComposerMain from "../ui/ESQLComposerMain";

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <ESQLComposerMain />
    </ChakraProvider>
  );
};

export default App;
