import { CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  StackDivider,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import SpinningButton from "./SpinningButton";

interface LLMConfigurationProps {
  modelSelected: number;
  setModelSelected: (value: number) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  apiKeyWorks: boolean | null;
  setApiKeyWorks: (value: boolean | null) => void;
  tooltipsShown: boolean;
  testAPIKey: () => Promise<void>;
}

const LLMConfiguration: React.FC<LLMConfigurationProps> = ({
  modelSelected,
  setModelSelected,
  apiKey,
  setApiKey,
  apiKeyWorks,
  setApiKeyWorks,
  tooltipsShown,
  testAPIKey,
}) => {
  const modelSliderlabelStyles = {
    mt: "3",
    ml: "-3",
    fontSize: "sm",
    fontFamily: "monospace",
  };

  return (
    <VStack align="stretch" justify="space-between" spacing={6}>
      <form onSubmit={(e) => e.preventDefault()}>
        <HStack
          justify="space-between"
          align="stretch"
          spacing={8}
          divider={<StackDivider borderColor="gray.200" />}
        >
          <FormControl as="fieldset" width="200px">
            <FormLabel as="legend">Claude 3.5 Model</FormLabel>
            <Box p={5} pt={0}>
              <Slider
                aria-label="Model Selection"
                onChange={(val) => setModelSelected(val)}
                value={modelSelected}
                min={0}
                max={1}
                step={1}
              >
                <SliderMark value={0} {...modelSliderlabelStyles}>
                  Haiku
                </SliderMark>
                <SliderMark value={1} {...modelSliderlabelStyles}>
                  Sonnet
                </SliderMark>
                {/* <SliderMark value={2} {...modelSliderlabelStyles}>
                  Opus
                </SliderMark> */}
                <SliderTrack bg="gray.200">
                  <SliderFilledTrack bg="gold" />
                </SliderTrack>
                <SliderThumb boxSize={5 + 2 * modelSelected} bg="red.50">
                  <Text fontSize="sm">{"$".repeat(modelSelected + 1)}</Text>
                </SliderThumb>
              </Slider>
            </Box>
            <FormHelperText>
              As of November 1st, Haiku 3.5 was still{" "}
              <Link
                isExternal
                href="https://www.anthropic.com/pricing#anthropic-api"
              >
                <ExternalLinkIcon mx="3px" />
                not available
              </Link>
            </FormHelperText>
          </FormControl>
          <FormControl
            isRequired
            isInvalid={apiKey.length !== 0 && apiKeyWorks === false}
            isDisabled={apiKey.length !== 0 && apiKeyWorks === true}
            flex={1}
          >
            <FormLabel>Anthropic API Key</FormLabel>
            <InputGroup>
              <Input
                placeholder="Enter key here"
                value={apiKey}
                autoComplete="anthropic-api-key"
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setApiKeyWorks(null);
                }}
                type="password"
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
              Since we use{" "}
              <Link
                isExternal
                href="https://www.anthropic.com/news/prompt-caching"
              >
                <ExternalLinkIcon /> beta features of the API
              </Link>
              , only direct Anthropic access is supported.
            </FormHelperText>
          </FormControl>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Perform a test request to the API"
          >
            <SpinningButton
              type="submit"
              spinningAction={testAPIKey}
              disabled={!apiKey}
            >
              Test API
            </SpinningButton>
          </Tooltip>
        </HStack>
      </form>
    </VStack>
  );
};

export default LLMConfiguration;
