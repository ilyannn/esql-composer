import { useState, useEffect, useRef } from "react";
import axios from "axios";
import autosize from "autosize";
import moment from "moment";
import Anthropic from "@anthropic-ai/sdk";
import ClockLoader from "react-spinners/ClockLoader";

import { useInterval } from "usehooks-ts";

import {
  Box,
  Input,
  Textarea,
  VStack,
  HStack,
  Heading,
  Button,
  Tooltip,
  useToast,
  Spacer,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionIcon,
  AccordionPanel,
  FormControl,
  FormLabel,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import SpinningButton from "./SpinningButton";
import Statistics from "./Statistics";
import LLMConfiguration from "./LLMConfiguration";

import {
  testWithSimpleQuestion,
  warmCache,
  generateESQLUpdate,
} from "../services/requests";

import { COMPLETION_KEY } from "./constants";
import HowToUse from "./HowToUse";

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
  const [allStats, setAllStats] = useState([]);
  const naturalInputRef = useRef(null);
  const esqlInputRef = useRef(null);
  const esqlCompletionRef = useRef(null);
  const esqlCompleteButtonRef = useRef(null);
  const toast = useToast();
  const [history, setHistory] = useState([]);

  // Since Haiku 3.5 is not available yet.
  const [modelSelected, setModelSelected] = useState(1);

  useEffect(() => {
    // Load the contents of esql.txt and schema.txt
    loadSchemaFile("schema-flights.txt");
    const defaultApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (defaultApiKey !== undefined) {
      setApiKey(defaultApiKey);
      if (naturalInputRef.current) {
        naturalInputRef.current.focus();
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
    if (
      cacheWarmedInfo.esqlGuideText === esqlGuideText &&
      cacheWarmedInfo.schemaGuideText === schemaGuideText &&
      cacheWarmedInfo.modelSelected === modelSelected
    ) {
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
  useInterval(updateCacheWarmedText, 5 * 1000);

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
      const data = await warmCache(
        apiKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText
      );

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

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading>ES|QL Composer</Heading>
        <Accordion defaultIndex={[1, 2, 3]} allowMultiple>
          <AccordionItem backgroundColor={"green.50"}>
            <AccordionButton>
              <Heading as="h3" size="md">
                <AccordionIcon /> How to Use
              </Heading>
            </AccordionButton>
            <AccordionPanel>
              <HowToUse
                tooltipsShown={tooltipsShown}
                setTooltipsShown={setTooltipsShown}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem backgroundColor={"cyan.50"}>
            <AccordionButton>
              <Heading as="h3" size="md">
                <AccordionIcon /> LLM Access
              </Heading>
            </AccordionButton>
            <AccordionPanel>
              <LLMConfiguration
                modelSelected={modelSelected}
                setModelSelected={setModelSelected}
                apiKey={apiKey}
                setApiKey={setApiKey}
                apiKeyWorks={apiKeyWorks}
                setApiKeyWorks={setApiKeyWorks}
                tooltipsShown={tooltipsShown}
                testAPIKey={testAPIKey}
              />
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
                    <Text fontSize={"sm"}>{cacheWarmedText}</Text>
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

          <AccordionItem>
            <AccordionButton>
              <Heading as="h3" size="md">
                <AccordionIcon />
              </Heading>
            </AccordionButton>

            <AccordionPanel>
              <VStack align={"stretch"} justify={"space-between"} spacing={10}>
                <VStack align={"stretch"} justify={"space-between"}>
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
                          !apiKey ||
                          !esqlGuideText ||
                          !schemaGuideText ||
                          !naturalInput
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
                          !apiKey ||
                          !esqlGuideText ||
                          !schemaGuideText ||
                          !esqlInput
                        }
                        ref={esqlCompleteButtonRef}
                      >
                        Complete
                      </SpinningButton>
                    </Tooltip>
                    <Spacer />
                    <Tooltip
                      isDisabled={!tooltipsShown}
                      label="Pretty print the ES|QL"
                    >
                      <SpinningButton
                        spinningAction={() =>
                          performESQLRequest("Prettify the provided ES|QL")
                        }
                        disabled={
                          !apiKey ||
                          !esqlGuideText ||
                          !schemaGuideText ||
                          !esqlInput
                        }
                      >
                        Prettify
                      </SpinningButton>
                    </Tooltip>
                    <Tooltip
                      isDisabled={!tooltipsShown}
                      label="Copy ES|QL to Clipboard"
                    >
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
                </VStack>
                <Statistics tooltipsShown={tooltipsShown} stats={allStats} />
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};

export default Form;
