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
import SpinningButton from "./components/SpinningButton";

interface LLMConfigurationAreaProps {
  modelSelected: number;
  setModelSelected: (value: number) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  apiKeyWorks: boolean | null;
  setApiKeyWorks: (value: boolean | null) => void;
  tooltipsShown: boolean;
  testAPIKey: () => Promise<void>;
}

const LLMConfigurationArea: React.FC<LLMConfigurationAreaProps> = ({
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
              <Link
                isExternal
                href="https://www.anthropic.com/pricing#anthropic-api"
              >
                <ExternalLinkIcon mx="3px" />
                Compare model pricing.
              </Link>
            </FormHelperText>
          </FormControl>
          <FormControl
            isRequired
            isInvalid={apiKey.length !== 0 && apiKeyWorks === false}
            flex={1}
          >
            <FormLabel>Anthropic API Key</FormLabel>
            <InputGroup>
              <Input
                autoFocus={true}
                type="password"
                placeholder="Enter key here"
                value={apiKey}
                autoComplete="anthropic-api-key"
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
              Since we use{" "}
              <Link
                isExternal
                href="https://www.anthropic.com/news/prompt-caching"
              >
                <ExternalLinkIcon /> beta features
              </Link>
              , only direct access is supported.
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
              Test
            </SpinningButton>
          </Tooltip>
        </HStack>
      </form>
    </VStack>
  );
};

export default LLMConfigurationArea;
