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
  useToast,
} from "@chakra-ui/react";
import React, { useCallback } from "react";
import RecordView from "./components/RecordView";
import SpinningButton from "./components/SpinningButton";

interface QueryAPIConfigurationAreaProps {
  apiURL: string;
  setApiURL: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  apiKeyWorks: boolean | null;
  info: Record<string, string> | null;
  tooltipsShown: boolean;
  handleShowInfo: () => Promise<void>;
}

const QueryAPIConfigurationArea: React.FC<QueryAPIConfigurationAreaProps> = ({
  apiURL,
  setApiURL,
  apiKey,
  setApiKey,
  apiKeyWorks,
  tooltipsShown,
  handleShowInfo,
  info,
}) => {
  const toast = useToast();
  const [isAPIKeyDragging, setIsAPIKeyDragging] = React.useState(false);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsAPIKeyDragging(true);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsAPIKeyDragging(false);
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles.length > 0) {
        for (const file of droppedFiles) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const json = JSON.parse(e.target?.result as string);
              if ("encoded" in json && typeof json.encoded === "string") {
                setApiKey(json.encoded);
                const name =
                  "name" in json && typeof json.name === "string"
                    ? `named '${json.name}' `
                    : "";
                toast({
                  title: "API Key Drag & Drop",
                  description: `API key ${name}successfully loaded from file.`,
                  status: "success",
                  duration: 2500,
                  isClosable: true,
                });
              } else {
                throw new Error("Invalid API key file.");
              }
            } catch (e) {
              toast({
                title: "API Key Drag & Drop",
                description:
                  "Failed to load API key from file. Make sure the file is a valid JSON object with an 'encoded' field.",
                status: "error",
                duration: 4000,
                isClosable: true,
              });
            }
          };
          reader.readAsText(file);
        }
      }
    },
    [toast, setApiKey]
  );

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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={() => setIsAPIKeyDragging(true)}
            onDragLeave={() => setIsAPIKeyDragging(false)}
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
                }}
                style={
                  isAPIKeyDragging
                    ? { border: "1px dashed blue", color: "blue" }
                    : {}
                }
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
          <VStack align="stretch" justify="space-between" flex={0}>
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
                Show Info
              </SpinningButton>
            </Tooltip>
            {info && <RecordView record={info} />}
          </VStack>
        </HStack>
      </form>
    </VStack>
  );
};

export default QueryAPIConfigurationArea;
