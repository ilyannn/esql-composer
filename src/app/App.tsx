import { ChakraProvider } from "@chakra-ui/react";
import React, { StrictMode } from "react";

import ESQLComposerMain from "../ui/ESQLComposerMain";

const App: React.FC = () => {
  return (
    <StrictMode>
      <ChakraProvider>
        <ESQLComposerMain />
      </ChakraProvider>
    </StrictMode>
  );
};

export default App;
