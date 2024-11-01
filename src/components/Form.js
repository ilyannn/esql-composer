import { useState, useEffect, useRef} from "react";
import axios from "axios";
import autosize from "autosize";
import moment from 'moment';
import Anthropic from "@anthropic-ai/sdk";
import ClockLoader from "react-spinners/ClockLoader";

import { useInterval } from 'usehooks-ts'

import {
  Box,
  Input,
  Textarea,
  VStack,
  HStack,
  Heading,
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
  FormControl,
  FormLabel,
  FormHelperText,
  InputRightElement,
  InputGroup,
  Slider,
  SliderMark,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import SpinningButton from "./SpinningButton";
import { CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";

import {
  testWithSimpleQuestion,
  warmCache,
  generateESQLUpdate,
} from "../services/requests";

const GENERATION_KEY = "Enter";
const COMPLETION_KEY = "`";

const Form = () => {
  const [apiKey, setApiKey] = useState("");
  const [cacheWarmedInfo, setCacheWarmedInfo] = useState(null);
  const [cacheWarmedText, setCacheWarmedText] = useState(null);
  const [esqlGuideText, setEsqlGuideText] = useState("");
  const [schemaGuideText, setSchemaGuideText] = useState("");
  const [esqlInput, setEsqlInput] = useState("");
  const [esqlCompletion, setEsqlCompletion] = useState("");
  const [naturalInput, setNaturalInput] = useState("");
  const [tooltipsShown, setTooltipsShown] = useState(true);
  const [apiKeyWorks, setApiKeyWorks] = useState(null);
  const [stats, setStats] = useState(null);
  const [allStats, setAllStats] = useState([]);
  const apiKeyRef = useRef(null);
  const naturalInputRef = useRef(null);
  const esqlInputRef = useRef(null);
  const esqlCompletionRef = useRef(null);
  const esqlCompleteButtonRef = useRef(null);
  const toast = useToast();
  const [history, setHistory] = useState([]);

  // Since Haiku 3.5 is not available yet.
  const [modelSelected, setModelSelected] = useState(1);

  const modelSliderlabelStyles = {
    mt: "3",
    ml: "-3",
    fontSize: "sm",
    fontFamily: "monospace",
  };

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
    const esqlCompletionRefValue = esqlCompletionRef.current;
    autosize(esqlInputRefValue);
    autosize(esqlCompletionRefValue);
    return () => {
      autosize.destroy(esqlInputRefValue);
      autosize.destroy(esqlCompletionRefValue);
    };
  }, []);

  useEffect(() => {
    if (!cacheWarmedInfo) {
      return;
    }
    if (cacheWarmedInfo.esqlGuideText === esqlGuideText && cacheWarmedInfo.schemaGuideText === schemaGuideText && cacheWarmedInfo.modelSelected === modelSelected) {
      return;
    }
    setCacheWarmedInfo(null);
  }, [modelSelected, esqlGuideText, schemaGuideText, cacheWarmedInfo]);

  const updateCacheWarmedText = () => {
    if (!cacheWarmedInfo) {
      setCacheWarmedText(null);
      return;
    }
    const { date } = cacheWarmedInfo;
    const fromNow = moment(date).fromNow();
    setCacheWarmedText(`cached ${fromNow}`);
  };

  useEffect(updateCacheWarmedText, [cacheWarmedInfo]);
  useInterval(updateCacheWarmedText, 5 * 1000)

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
    const cursorY = esqlBeforeCursor.split("\n").length - 1;
    const cursorX =
      esqlBeforeCursor.length -
      (cursorY === 0 ? 0 : esqlBeforeCursor.lastIndexOf("\n") + 1);

    let lineEnd = esqlInput.indexOf("\n", cursorPosition);
    if (lineEnd === -1) {
      lineEnd = esqlInput.length;
    }
    if (lineEnd > cursorPosition) {
      setEsqlInput(
        esqlInput.substring(0, cursorPosition) + esqlInput.substring(lineEnd)
      );
    }
    setEsqlCompletion("");

    let newESQLCompletion = "\n".repeat(cursorY) + " ".repeat(cursorX);

    const haveESQLLine = (line) => {
      newESQLCompletion += line + "\n";
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
      setEsqlCompletion(newESQLCompletion);
      autosize.update(esqlCompletionRef.current);
      /*      esqlInputRef.current.setSelectionRange(
        cursorPosition,
        cursorPosition + line.length
      );
*/
    };

    try {
      const data = await generateESQLUpdate(
        apiKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        esqlBeforeCursor,
        undefined,
        haveESQLLine,
        undefined
      );
      setStats(data.stats);
      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();
    } catch (error) {
      console.error("Completion error:", error);
    }
  };

  /**
   * Handles API errors and updates the state of apiKeyWorks.
   *
   * Stores the information about the authentication success or failure.
   * Displays a toast if the API call fails and it's not an authentication failure.
   *
   * @param {string} label - The action being performed, used in error messages.
   * @param {Function} action - The function that performs the API call.
   * @returns {Promise<*>} The result of the API call if successful.
   */
  const performAPIAction = async (label, action) => {
    try {
      const answer = await action();
      setApiKeyWorks(true);
      return answer;
    } catch (error) {
      if (error instanceof Anthropic.APIError && error.status === 401) {
        setApiKeyWorks(false);
      }

      let title = `${label} error`;
      let description;

      if (error instanceof Anthropic.APIError) {
        description = `${error.status} – ${error.error.error.message}`;
      } else if (error && typeof error === "object" && "message" in error) {
        description = error.message;
      }

      toast({
        title,
        description,
        status: "error",
        isClosable: true,
      });
    }
  };

  const testAPIKey = async () => {
    const claudeAnswer = await performAPIAction("API test", () =>
      testWithSimpleQuestion(apiKey, modelSelected)
    );

    if (claudeAnswer) {
      toast({
        title: "API test successful",
        description: `Claude says: ${claudeAnswer}`,
        status: "success",
        isClosable: true,
      });
    }
  };

  const handleWarmCache = async () => {
    await performAPIAction("Cache warming", async () => {
      const data = await warmCache(apiKey, modelSelected, esqlGuideText, schemaGuideText);

      setStats(data.stats);
      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();

      toast({
        title: "Cache warming successful",
        description: `Cache will now provide ${
          data.stats.saved_to_cache + data.stats.input_cached
        } tokens for requests like this.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (naturalInputRef.current) {
        naturalInputRef.current.focus();
      }
    });
  };

  const performESQLRequest = async (text) => {
    await performAPIAction("ES|QL generation", async () => {
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
        autosize.update(esqlInputRef.current);
      };
      const doneESQL = () => {
        lineIndex++;
        if (lineIndex < interpolatedLines.length) {
          interpolatedLines.splice(lineIndex);
          setEsqlInput(interpolatedLines.join("\n"));
          autosize.update(esqlInputRef.current);
        }
      };
      setEsqlCompletion("");
      const data = await generateESQLUpdate(
        apiKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        esqlInput,
        text,
        haveESQLLine,
        doneESQL
      );
      saveCacheWarmedInfo();
      setStats(data.stats);
      setAllStats([...allStats, data.stats]);
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
    });
  };

  const handleUpdateESQL = async () => {
    await performESQLRequest(naturalInput);
  };

  const clearESQL = () => {
    setEsqlInput("");
    setEsqlCompletion("");
    setNaturalInput("");
    setHistory([]);
  };

  const saveCacheWarmedInfo = () => {
    setCacheWarmedInfo({
      date: Date.now(),
      esqlGuideText,
      schemaGuideText,
      modelSelected,
    });
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
    const csvContent = [
      [
        "TTFT",
        "ESQL Time",
        "Total Time",
        "Cached",
        "Uncached",
        "Saved",
        "Output",
        "Model",
      ],
      ...allStats.map((stat) => [
        stat.first_token_time,
        stat.esql_time,
        stat.total_time,
        stat.input_cached,
        stat.input_uncached,
        stat.saved_to_cache,
        stat.output,
        stat.model,
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
        <Accordion defaultIndex={[1, 2]} allowMultiple>
          <AccordionItem backgroundColor={"green.50"}>
            <AccordionButton>
              <Heading as="h3" size="md">
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
              <Heading as="h3" size="md">
                <AccordionIcon /> API Configuration
              </Heading>
            </AccordionButton>
            <AccordionPanel>
              <form onSubmit={(e) => e.preventDefault()}>
                <HStack
                  justify={"space-between"}
                  align={"stretch"}
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
                        <SliderThumb
                          boxSize={5 + 2 * modelSelected}
                          bg="red.50"
                        >
                          <Text fontSize="sm">
                            {"$".repeat(modelSelected + 1)}
                          </Text>
                        </SliderThumb>
                      </Slider>
                    </Box>
                    <FormHelperText>
                      As of October 31st, Haiku 3.5 was still{" "}
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
                    isInvalid={apiKey && apiKeyWorks === false}
                    isDisabled={apiKey && apiKeyWorks === true}
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
                        ref={apiKeyRef}
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
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem backgroundColor={"yellow.50"}>
            <AccordionButton>
              <Heading as="h3" size="md">
                <AccordionIcon /> Reference Guides
              </Heading>
              <Spacer />
              {cacheWarmedText && (
                      <Tooltip
                        isDisabled={!tooltipsShown}
                        label="Time since the current values were put into the cache"
                      >
                        <HStack align={"center"} justify={"flex-start"}>
                          <ClockLoader
                            color="#49c325"
                            size={16}
                            speedMultiplier={0.15}
                          />
                          <Text fontSize={"sm"}>
                            {cacheWarmedText}
                          </Text>
                        </HStack>
                      </Tooltip>
                    )}

            </AccordionButton>
            <AccordionPanel>
              <ResizableBox
                width={Infinity}
                height={200}
                minConstraints={[Infinity, 200]}
                axis="y"
                resizeHandles={["se"]}
              >
                <HStack
                  justify={"space-between"}
                  align={"stretch"}
                  spacing={8}
                  height={"100%"}
                  divider={<StackDivider borderColor="gray.200" />}
                >
                  <VStack align="stretch" justify="flex-start" flex={1}>
                    <FormControl
                      isRequired={true}
                      flex={1}
                      display="flex"
                      flexDirection={"column"}
                    >
                      <FormLabel>ES|QL Reference</FormLabel>
                      <Textarea
                        placeholder="Put reference material here."
                        value={esqlGuideText}
                        onChange={(e) => setEsqlGuideText(e.target.value)}
                        flex={1}
                        resize={"none"}
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
                    </FormControl>
                  </VStack>

                  <VStack align="stretch" justify="flex-start" flex={1}>
                    <FormControl
                      isRequired={true}
                      flex={1}
                      display="flex"
                      flexDirection={"column"}
                    >
                      <FormLabel>Schema Description</FormLabel>
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
                    </FormControl>
                  </VStack>
                  <VStack align="center" justify="flex-start">
                    <Tooltip
                      isDisabled={!tooltipsShown}
                      label="Send a request with the current ES|QL and schema"
                    >
                      <SpinningButton
                        spinningAction={handleWarmCache}
                        disabled={
                          !apiKey.length ||
                          !esqlGuideText.length ||
                          !schemaGuideText.length
                        }
                      >
                        Warm Cache
                      </SpinningButton>
                    </Tooltip>
                  </VStack>
                </HStack>
              </ResizableBox>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <form onSubmit={(e) => e.preventDefault()}>
          <HStack>
            <FormControl flex={1}>
              <Input
                placeholder="Natural Text"
                value={naturalInput}
                onChange={handleNaturalTextChange}
                ref={naturalInputRef}
                flex={1}
              />
            </FormControl>
            <SpinningButton
              type="submit"
              spinningAction={handleUpdateESQL}
              disabled={
                !apiKey || !esqlGuideText || !schemaGuideText || !naturalInput
              }
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
        </form>

        <HStack align="stretch" justify="flex-start">
          <VStack spacing={0} align="stretch" flex={1}>
            <Box height={0} overflow={"visible"}>
              <Textarea
                value={esqlCompletion}
                ref={esqlCompletionRef}
                readOnly
                disabled
                fontFamily={"monospace"}
                whiteSpace="pre-wrap"
                style={{
                  opacity: 0.5,
                  borderColor: "transparent",
                }}
                flex={1}
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
                    esqlCompleteButtonRef.current?.click();
                  }
                }}
              />
            </Box>
          </VStack>
        </HStack>
        <HStack>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Complete the current line"
          >
            <SpinningButton
              spinningAction={handleCompleteESQL}
              disabled={
                !apiKey || !esqlGuideText || !schemaGuideText || !esqlInput
              }
              ref={esqlCompleteButtonRef}
            >
              Complete
            </SpinningButton>
          </Tooltip>
          <Spacer />
          <Tooltip isDisabled={!tooltipsShown} label="Pretty print the ES|QL">
            <SpinningButton
              spinningAction={() =>
                performESQLRequest("Prettify the provided ES|QL")
              }
              disabled={
                !apiKey || !esqlGuideText || !schemaGuideText || !esqlInput
              }
            >
              Prettify
            </SpinningButton>
          </Tooltip>
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
