import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import autosize from "autosize";

import {
  Box,
  Input,
  Textarea,
  VStack,
  Text,
  HStack,
  Heading,
  Alert,
  AlertIcon,
  CloseButton,
  AlertTitle,
  AlertDescription,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Tooltip,
  useToast,
  Spacer,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionIcon,
  AccordionPanel,
  ListItem,
  UnorderedList,
  Checkbox,
  Link,
} from "@chakra-ui/react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import SpinningButton from "./SpinningButton";
import {
  WarningIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";

import { warmCache, generateESQLUpdate } from "../services/requests";

const GENERATION_KEY = "Enter";
const COMPLETION_KEY = "`";

const Form = () => {
  const [apiKey, setApiKey] = useState("");
  const [esqlGuideText, setEsqlGuideText] = useState("");
  const [schemaGuideText, setSchemaGuideText] = useState("");
  const [esqlInput, setEsqlInput] = useState("");
  const [esqlCompletion, setEsqlCompletion] = useState("");
  const [naturalInput, setNaturalInput] = useState("");
  const [isWarmCacheLoading, setIsWarmCacheLoading] = useState(false);
  const [isUpdateESQLLoading, setIsUpdateESQLLoading] = useState(false);
  const [isPrettifyESQLLoading, setIsPrettifyESQLLoading] = useState(false);
  const [tooltipsShown, setTooltipsShown] = useState(true);
  const [warmCacheError, setWarmCacheError] = useState(null);
  const [apiKeyWorks, setApiKeyWorks] = useState(null);
  const [stats, setStats] = useState(null);
  const [allStats, setAllStats] = useState([]);
  const apiKeyRef = useRef(null);
  const naturalInputRef = useRef(null);
  const esqlInputRef = useRef(null);
  const toast = useToast();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load the contents of esql.txt and schema.txt
    loadSchemaFile("schema-flights.txt");
    const defaultApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (defaultApiKey !== undefined) {
      setApiKey(defaultApiKey);
      if (naturalInputRef.current) {
        naturalInputRef.current.focus();
      }
    } else {
      if (apiKeyRef.current) {
        apiKeyRef.current.focus();
      }
    }

    // https://github.com/chakra-ui/chakra-ui/issues/670#issuecomment-625770981
    const esqlInputRefValue = esqlInputRef.current;
    autosize(esqlInputRefValue);
    return () => {
      autosize.destroy(esqlInputRefValue);
    };
  }, []);

  const loadESQLFile = async (filename) => {
    if (!filename) {
      setEsqlGuideText("");
      return;
    }
    axios
      .get(filename)
      .then((response) => {
        setEsqlGuideText(response.data);
      })
      .catch((error) => {
        console.error(`Error loading ${filename}:`, error);
      });
  };

  const loadSchemaFile = async (filename) => {
    if (!filename) {
      setSchemaGuideText("");
      return;
    }
    axios
      .get(filename)
      .then((response) => {
        setSchemaGuideText(response.data);
      })
      .catch((error) => {
        console.error(`Error loading ${filename}:`, error);
      });
  };

  const handleWarmCache = async () => {
    setIsWarmCacheLoading(true);
    try {
      const data = await warmCache(apiKey, esqlGuideText, schemaGuideText);
      toast({
        title: "Request successful",
        description: `Cache was succesfully warmed up.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setStats(data.stats);
      setAllStats([...allStats, data.stats]);
      setWarmCacheError(null);
      if (naturalInputRef.current) {
        naturalInputRef.current.focus();
      }
      setApiKeyWorks(true);
    } catch (error) {
      setWarmCacheError(error);
      console.error("Error:", error);
      if (error instanceof Anthropic.APIError && error.status === 401) {
        setApiKeyWorks(false);
      }
    } finally {
      setIsWarmCacheLoading(false);
    }
  };

  const handleNaturalTextChange = async (e) => {
    const text = e.target.value;
    setNaturalInput(text);
  };

  const handleCompleteESQL = async () => {
    if (esqlInputRef.current === null) {
      return;
    }
    const cursorPosition = esqlInputRef.current.selectionStart;
    if (esqlInputRef.current.selectionEnd !== cursorPosition) {
      return;
    }
    const esqlBeforeCursor = esqlInput.substring(0, cursorPosition);

    console.log("Cursor position:", cursorPosition);

    const haveESQLLine = (line) => {
      console.log("Line completion:", line);
      const newESQL = esqlBeforeCursor + line;
      /*      const updatedCursorPosition = esqlInputRef.current.selectionStart;
      if (updatedCursorPosition > cursorPosition) {
        // User has entered more text in the meantime
        const enteredText = esqlInput.substring(
          cursorPosition,
          updatedCursorPosition
        );
        if (!line.startsWith(enteredText)) {
          return;
        }
      }*/
      setEsqlCompletion(newESQL);
      /*      esqlInputRef.current.setSelectionRange(
        cursorPosition,
        cursorPosition + line.length
      );
*/
    };

    try {
      const data = await generateESQLUpdate(
        apiKey,
        esqlGuideText,
        schemaGuideText,
        esqlBeforeCursor,
        undefined,
        haveESQLLine,
        undefined
      );
      setStats(data.stats);
      setAllStats([...allStats, data.stats]);
    } catch (error) {
      console.error("Completion error:", error);
    }
  };

  const performESQLRequest = async (text) => {
    try {
      let interpolatedLines = esqlInput.split("\n");
      let lineIndex = -1;
      const haveESQLLine = (line) => {
        setApiKeyWorks(true);
        line = line.trimRight();
        lineIndex++;
        if (lineIndex >= interpolatedLines.length) {
          interpolatedLines.push(line);
        } else if (interpolatedLines[lineIndex] !== line) {
          interpolatedLines[lineIndex] = line;
        } else {
          return;
        }
        setEsqlInput(interpolatedLines.join("\n"));
      };
      const doneESQL = () => {
        lineIndex++;
        if (lineIndex < interpolatedLines.length) {
          interpolatedLines.splice(lineIndex);
          setEsqlInput(interpolatedLines.join("\n"));
        }
        autosize.update(esqlInputRef.current);
      };
      setEsqlCompletion("");
      const data = await generateESQLUpdate(
        apiKey,
        esqlGuideText,
        schemaGuideText,
        esqlInput,
        text,
        haveESQLLine,
        doneESQL
      );
      setStats(data.stats);
      setAllStats([...allStats, data.stats]);
      setApiKeyWorks(true);
      setHistory([
        ...history,
        {
          text,
          esqlInput,
          esql: interpolatedLines.join("\n"),
          stats: data.stats,
        },
      ]);
      if (naturalInputRef.current?.value === text) {
        naturalInputRef.current?.setSelectionRange(0, naturalInput.length);
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Anthropic.APIError && error.status === 401) {
        setApiKeyWorks(false);
      }
    }
  };

  const handleUpdateESQL = async () => {
    try {
      setIsUpdateESQLLoading(true);
      await performESQLRequest(naturalInput);
    } finally {
      setIsUpdateESQLLoading(false);
    }
  };

  const handleApiKeyKeyDown = (e) => {
    if (e.key === GENERATION_KEY) {
      handleWarmCache();
    }
  };

  const handleNaturalTextKeyDown = (e) => {
    if (e.key === GENERATION_KEY) {
      handleUpdateESQL();
    }
  };

  const clearESQL = () => {
    setEsqlInput("");
    setEsqlCompletion("");
    setNaturalInput("");
    setHistory([]);
  };

  const copyESQL = () => {
    navigator.clipboard.writeText(esqlInput);
    toast({
      title: "ES|QL copied to clipboard",
      status: "success",
      duration: 750,
      isClosable: true,
    });
  };

  const prettifyESQL = async () => {
    try {
      setIsPrettifyESQLLoading(true);
      await performESQLRequest("Prettify the provided ES|QL");
    } finally {
      setIsPrettifyESQLLoading(false);
    }
  };

  const revertUpdate = () => {
    if (history.length > 0) {
      const last = history.pop();
      setNaturalInput(last.naturalInput);
      setEsqlInput(last.esqlInput);
    }
  };

  const showHistory = () => {
    const jsonHistory = JSON.stringify(history, null, 2);
    const newWindow = window.open();
    newWindow.document.write(`<pre>${jsonHistory}</pre>`);
  };

  const showStatistics = () => {
    console.log("All stats:", allStats);
    const csvContent = [
      [
        "TTFT",
        "ESQL Time",
        "Total Time",
        "Cached",
        "Uncached",
        "Saved",
        "Output",
      ],
      ...allStats.map((stat) => [
        stat.first_token_time,
        stat.esql_time,
        stat.total_time,
        stat.input_cached,
        stat.input_uncached,
        stat.saved_to_cache,
        stat.output,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "statistics.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading>ES|QL Composer</Heading>
        <Accordion defaultIndex={[0, 1]} allowToggle allowMultiple>
          <AccordionItem backgroundColor={"green.50"}>
            <AccordionButton>
              <Heading as="h3" size="sm">
                <AccordionIcon /> How to Use
              </Heading>
            </AccordionButton>
            <AccordionPanel>
              <HStack justify="space-between" align="stretch">
                <UnorderedList>
                  <ListItem>
                    Enter your Anthropic API key in the input field below.
                  </ListItem>
                  <ListItem>
                    Add the ES|QL language and Elasticsearch schema reference
                    guides.
                  </ListItem>
                  <ListItem>
                    Optionally, warm the cache before sending other requests.
                  </ListItem>
                  <ListItem>
                    Input some natural text and press{" "}
                    <kbd>{GENERATION_KEY}</kbd> to convert it to ES|QL.
                  </ListItem>
                  <ListItem>
                    Press <kbd>{COMPLETION_KEY}</kbd> in the ES|QL area to show
                    a completion (you can't insert it yet).
                  </ListItem>
                  <ListItem>
                    You can export the history as a JSON or statistics as CSV.
                  </ListItem>
                </UnorderedList>
                <VStack align="stretch" justify="space-between">
                  <Tooltip
                    isDisabled={!tooltipsShown}
                    label="Turn off the tooltips if they are annoying"
                  >
                    <Checkbox
                      isChecked={tooltipsShown}
                      onChange={(e) => {
                        setTooltipsShown(e.target.checked);
                      }}
                    >
                      Tooltips
                    </Checkbox>
                  </Tooltip>
                  <Link
                    href="https://github.com/ilyannn/esql-composer"
                    isExternal
                  >
                    <ExternalLinkIcon mx="3px" /> source
                  </Link>
                </VStack>
              </HStack>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem backgroundColor={"cyan.50"}>
            <AccordionButton>
              <Heading as="h3" size="sm">
                <AccordionIcon /> API Key
              </Heading>
            </AccordionButton>
            <AccordionPanel>
              <HStack>
                {apiKeyWorks === true ? (
                  <CheckCircleIcon color="green.500" />
                ) : apiKeyWorks === false ? (
                  <WarningIcon color="red.500" />
                ) : null}
                <Input
                  placeholder="Anthropic API Key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiKeyWorks(null);
                  }}
                  type="password"
                  ref={apiKeyRef}
                  onKeyDown={handleApiKeyKeyDown}
                  isInvalid={apiKey && apiKeyWorks === false}
                  isDisabled={apiKey && apiKeyWorks === true}
                  errorBorderColor="red.300"
                  flex={1}
                />
                <Tooltip
                  isDisabled={!tooltipsShown}
                  label="Send a request with the current ES|QL and schema"
                >
                  <SpinningButton
                    isLoading={isWarmCacheLoading}
                    onClick={handleWarmCache}
                    disabled={!apiKey}
                  >
                    Warm Cache
                  </SpinningButton>
                </Tooltip>
              </HStack>
              {warmCacheError && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>{warmCacheError.message}</AlertTitle>
                    <AlertDescription>
                      {warmCacheError.response && (
                        <Text>
                          Status: {warmCacheError.response.status} -{" "}
                          {warmCacheError.response.statusText}
                        </Text>
                      )}
                    </AlertDescription>
                  </Box>
                  <CloseButton
                    alignSelf="flex-start"
                    position="absolute"
                    right={-1}
                    top={-1}
                    onClick={() => setWarmCacheError(null)}
                  />
                </Alert>
              )}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem backgroundColor={"yellow.50"}>
            <AccordionButton>
              <Heading as="h3" size="sm">
                <AccordionIcon /> Reference Guides
              </Heading>
            </AccordionButton>
            <AccordionPanel>
              <ResizableBox
                width={Infinity}
                height={200}
                minConstraints={[Infinity, 200]}
                axis="y"
                resizeHandles={["se"]}
              >
                <HStack align="stretch" justify="space-between" height="100%">
                  <VStack align="stretch" justify="flex-start" flex={1}>
                    <Textarea
                      placeholder="ES|QL reference"
                      value={esqlGuideText}
                      onChange={(e) => setEsqlGuideText(e.target.value)}
                      flex={1}
                      resize="none"
                    />

                    <HStack justify="space-evenly">
                      <Button
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => loadESQLFile("")}
                      >
                        Clear
                      </Button>
                    </HStack>
                  </VStack>
                  <VStack align="stretch" justify="flex-start" flex={1}>
                    <Textarea
                      placeholder="Your Elasticsearch schema reference"
                      value={schemaGuideText}
                      onChange={(e) => setSchemaGuideText(e.target.value)}
                      flex={1}
                      resize="none"
                    />
                    <HStack justify="space-evenly">
                      <Button
                        variant="ghost"
                        colorScheme="green"
                        onClick={(e) => loadSchemaFile("schema-flights.txt")}
                      >
                        Flights
                      </Button>
                      <Button
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => loadSchemaFile("")}
                      >
                        Clear
                      </Button>
                    </HStack>
                  </VStack>
                </HStack>
              </ResizableBox>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        <HStack>
          <Input
            placeholder="Natural Text"
            value={naturalInput}
            onChange={handleNaturalTextChange}
            onKeyDown={handleNaturalTextKeyDown}
            ref={naturalInputRef}
            flex={1}
          />
          <SpinningButton
            isLoading={isUpdateESQLLoading}
            onClick={handleUpdateESQL}
            disabled={!apiKey || !naturalInput}
          >
            {esqlInput ? "Update ES|QL" : "Generate ES|QL"}
          </SpinningButton>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Restore the inputs to the state before this button was pressed"
          >
            <Button
              variant="ghost"
              isDisabled={history.length === 0}
              colorScheme="red"
              onClick={(e) => revertUpdate()}
            >
              Undo
            </Button>
          </Tooltip>
        </HStack>
        <HStack align="stretch" justify="flex-start">
          <VStack spacing={0} align="stretch" flex={1}>
            <Box height={0}>
              <Textarea
                value={esqlCompletion}
                readOnly
                disabled
                fontFamily={"monospace"}
                whiteSpace="pre-wrap"
                style={{
                  height: "auto",
                  opacity: 0.5,
                  borderColor: "transparent",
                }}
                transition="height none"
                spellCheck={false}
                resize={"none"}
              />
            </Box>
            <Box flex={1}>
              <Textarea
                placeholder="ES|QL"
                value={esqlInput}
                ref={esqlInputRef}
                onChange={(e) => setEsqlInput(e.target.value)}
                fontFamily={"monospace"}
                whiteSpace="pre-wrap"
                style={{ height: "auto", background: "none" }}
                transition="height none"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === COMPLETION_KEY) {
                    e.preventDefault();
                    handleCompleteESQL();
                  }
                }}
              />
            </Box>
          </VStack>
        </HStack>
        <HStack>
          <Tooltip isDisabled={!tooltipsShown} label="Copy ES|QL to Clipboard">
            <Button
              variant="ghost"
              colorScheme="green"
              isDisabled={!esqlInput}
              onClick={(e) => copyESQL()}
            >
              Copy
            </Button>
          </Tooltip>
          <Tooltip isDisabled={!tooltipsShown} label="Pretty print the ES|QL">
            <SpinningButton
              isLoading={isPrettifyESQLLoading}
              onClick={(e) => prettifyESQL()}
              disabled={!apiKey || !esqlInput}
            >
              Prettify
            </SpinningButton>
          </Tooltip>
          <Spacer />
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Export history of prompt and request pairs"
          >
            <Button
              variant="ghost"
              isDisabled={history.length === 0}
              colorScheme="green"
              onClick={(e) => showHistory()}
            >
              History
            </Button>
          </Tooltip>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Reset the prompt and ES|QL and being anew."
          >
            <Button
              variant="ghost"
              colorScheme="red"
              isDisabled={!esqlInput && !naturalInput}
              onClick={(e) => clearESQL()}
            >
              Reset
            </Button>
          </Tooltip>
        </HStack>
        {stats && (
          <StatGroup>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Time to first output token"
            >
              <Stat>
                <StatLabel>TTFT</StatLabel>
                <StatNumber>{stats.first_token_time}ms</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Time to complete ES|QL generation"
            >
              <Stat>
                <StatLabel>ES|QL Time</StatLabel>
                <StatNumber>{stats.esql_time}ms</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Total time the request has taken"
            >
              <Stat>
                <StatLabel>Total Time</StatLabel>
                <StatNumber>{stats.total_time}ms</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Input tokens read from the cache"
            >
              <Stat>
                <StatLabel>Cached</StatLabel>
                <StatNumber>{stats.input_cached}</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Input tokens not read from the cache"
            >
              <Stat>
                <StatLabel>Uncached</StatLabel>
                <StatNumber>{stats.input_uncached}</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Input tokens saved to cache"
            >
              <Stat>
                <StatLabel>Saved</StatLabel>
                <StatNumber>{stats.saved_to_cache}</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip isDisabled={!tooltipsShown} label="Output tokens">
              <Stat>
                <StatLabel>Output</StatLabel>
                <StatNumber>{stats.output}</StatNumber>
              </Stat>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Download all statistics in CSV format"
            >
              <Button
                variant="ghost"
                colorScheme="green"
                isDisabled={allStats.length === 0}
                onClick={(e) => showStatistics()}
              >
                .csv
              </Button>
            </Tooltip>
          </StatGroup>
        )}
      </VStack>
    </Box>
  );
};

export default Form;
