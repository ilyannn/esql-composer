import { CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  StackDivider,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import SpinningButton from "./components/SpinningButton";

interface QueryAPIConfigurationAreaProps {
  apiURL: string;
  setApiURL: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  apiKeyWorks: boolean | null;
  setApiKeyWorks: (value: boolean | null) => void;
  tooltipsShown: boolean;
  handleShowInfo: () => Promise<void>;
}

const QueryAPIConfigurationArea: React.FC<QueryAPIConfigurationAreaProps> = ({
  apiURL,
  setApiURL,
  apiKey,
  setApiKey,
  apiKeyWorks,
  setApiKeyWorks,
  tooltipsShown,
  handleShowInfo,
}) => {
  return (
    <VStack align="stretch" justify="space-between" spacing={6}>
      <form onSubmit={(e) => e.preventDefault()}>
        <HStack
          justify="space-between"
          align="stretch"
          spacing={8}
          divider={<StackDivider borderColor="gray.200" />}
        >
          <FormControl flex={1}>
            <FormLabel>Elasticsearch URL</FormLabel>
            <InputGroup>
              <Input
                type="url"
                placeholder="Enter URL here"
                value={apiURL}
                autoComplete="elasticsearch-api-url"
                onChange={(e) => {
                  setApiURL(e.target.value);
                  setApiKeyWorks(null);
                }}
                flex={1}
              />
            </InputGroup>
            <FormHelperText>
              Make sure CORS{" "}
              <Link
                isExternal
                href="https://www.elastic.co/guide/en/elasticsearch/reference/current/search-application-security.html#search-application-security-cors"
              >
                <ExternalLinkIcon /> allows access
              </Link>
              {" or "}
              <Link
                isExternal
                href="https://github.com/elastic/elasticsearch-js/tree/main/docs/examples/proxy"
              >
                <ExternalLinkIcon />
                use proxy
              </Link>
              .
            </FormHelperText>
          </FormControl>
          <FormControl
            isInvalid={apiKey.length !== 0 && apiKeyWorks === false}
            flex={1}
          >
            <FormLabel>Elasticsearch API Key</FormLabel>
            <InputGroup>
              <Input
                type="password"
                placeholder="Enter key here"
                value={apiKey}
                autoComplete="elasticsearch-api-key"
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setApiKeyWorks(null);
                }}
                errorBorderColor="red.300"
                flex={1}
              />
              {apiKeyWorks === true ? (
                <InputRightElement>
                  <CheckIcon color="green.300" />
                </InputRightElement>
              ) : null}
            </InputGroup>
            <FormHelperText>
              <Link
                isExternal
                href="https://www.elastic.co/guide/en/kibana/8.15/api-keys.html"
              >
                <ExternalLinkIcon /> How to create an API key in Kibana.
              </Link>
            </FormHelperText>
          </FormControl>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Perform a test request to the API"
          >
            <SpinningButton
              type="submit"
              targets="es"
              spinningAction={handleShowInfo}
              disabled={!apiURL || !apiKey}
            >
              Test
            </SpinningButton>
          </Tooltip>
        </HStack>
      </form>
    </VStack>
  );
};

export default QueryAPIConfigurationArea;
