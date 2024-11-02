import autosize from "autosize";
import moment from "moment";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import {
  Accordion,
  Box,
  HStack,
  Heading,
  Link,
  VStack,
  Text,
  useToast,
} from "@chakra-ui/react";

import Anthropic from "@anthropic-ai/sdk";

import {
  generateESQLUpdate,
  testWithSimpleQuestion,
  warmCache,
} from "../services/requests";
import { StatisticsRow } from "../common/types";

import CacheWarmedNotice from "./components/CacheWarmedNotice";
import HowToUseArea from "./HowToUseArea";
import LLMConfigurationArea from "./LLMConfigurationArea";
import ESQLWorkingArea from "./ESQLWorkingArea";
import ReferenceGuidesArea from "./ReferenceGuidesArea";
import Section from "./components/Section";
import Statistics from "./components/Statistics";
import { ExternalLinkIcon } from "@chakra-ui/icons";

type HistoryRow = {
  text: string;
  esqlInput: string;
  esql: string;
  stats: StatisticsRow;
};

const ESQLComposerMain = () => {
  const toast = useToast();

  const [tooltipsShown, setTooltipsShown] = useState(true);

  // Since Haiku 3.5 is not available yet, default to Sonnet 3.5
  const [modelSelected, setModelSelected] = useState(1);
  const [apiKey, setApiKey] = useState("");

  const [esqlGuideText, setEsqlGuideText] = useState("");
  const [schemaGuideText, setSchemaGuideText] = useState("");

  const [naturalInput, setNaturalInput] = useState("");
  const [esqlInput, setEsqlInput] = useState("");
  const [esqlCompletion, setEsqlCompletion] = useState("");

  const [allStats, setAllStats] = useState<StatisticsRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const [apiKeyWorks, setApiKeyWorks] = useState<boolean | null>(null);
  const [cacheWarmedInfo, setCacheWarmedInfo] = useState<any | null>(null);
  const [cacheWarmedText, setCacheWarmedText] = useState<string | null>(null);

  const esqlInputRef = useRef<HTMLTextAreaElement>(null);
  const esqlCompletionRef = useRef<HTMLTextAreaElement>(null);
  const esqlCompleteButtonRef = useRef<HTMLButtonElement>(null);
  const naturalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (defaultApiKey !== undefined) {
      setApiKey(defaultApiKey);
      naturalInputRef.current?.focus();
    }
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
  const performAPIAction = async (
    label: string,
    action: () => Promise<void>
  ) => {
    try {
      const answer = await action();
      setApiKeyWorks(true);
      return answer;
    } catch (error) {
      if (error instanceof Anthropic.APIError && error.status === 401) {
        setApiKeyWorks(false);
      }

      let title: ReactNode = <Text>{label} error</Text>;
      let description: ReactNode = undefined;

      if (error instanceof Anthropic.APIError) {
        title = (
          <HStack>
            {title} <ExternalLinkIcon />
            <Link isExternal href={`https://http.dog/${error.status}`}>
              {error.status}
            </Link>
          </HStack>
        );
      } 

      if (
        error instanceof Anthropic.APIError &&
        error.error &&
        "error" in error.error &&
        error.error.error &&
        typeof error.error.error === "object" &&
        "message" in error.error.error &&
        typeof error.error.error.message === "string"
      ) {
        description = <Text>{error.error.error.message}</Text>;
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
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
    await performAPIAction("API test", async () => {
      const claudeAnswer = await testWithSimpleQuestion(apiKey, modelSelected);

      toast({
        title: "API test successful",
        description: `Claude says: ${claudeAnswer}`,
        status: "success",
        isClosable: true,
      });
    });
  };

  const handleWarmCache = async () => {
    await performAPIAction("Cache warming", async () => {
      const data = (await warmCache(
        apiKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText
      )) as any;

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

  const performESQLRequest = async (text: string) => {
    await performAPIAction("ES|QL generation", async () => {
      let interpolatedLines = esqlInput.split("\n");
      let lineIndex = -1;
      const haveESQLLine = (line: string) => {
        setApiKeyWorks(true);
        line = line.trimEnd();
        lineIndex++;
        if (lineIndex >= interpolatedLines.length) {
          interpolatedLines.push(line);
        } else if (interpolatedLines[lineIndex] !== line) {
          interpolatedLines[lineIndex] = line;
        } else {
          return;
        }
        setEsqlInput(interpolatedLines.join("\n"));
        if (esqlInputRef.current) {
          autosize.update(esqlInputRef.current);
        }
      };
      const doneESQL = () => {
        lineIndex++;
        if (lineIndex < interpolatedLines.length) {
          interpolatedLines.splice(lineIndex);
          setEsqlInput(interpolatedLines.join("\n"));
          if (esqlInputRef.current) {
            autosize.update(esqlInputRef.current);
          }
        }
      };
      setEsqlCompletion("");
      const data = (await generateESQLUpdate(
        apiKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        esqlInput,
        text,
        haveESQLLine,
        doneESQL,
        undefined
      )) as any;
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

    const haveESQLLine = (line: string) => {
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
      if (esqlCompletionRef.current) {
        autosize.update(esqlCompletionRef.current);
      }
      /*      esqlInputRef.current.setSelectionRange(
            cursorPosition,
            cursorPosition + line.length
          );
    */
    };

    try {
      const data = (await generateESQLUpdate(
        apiKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        esqlBeforeCursor,
        undefined,
        haveESQLLine,
        undefined,
        undefined
      )) as any;
      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();
    } catch (error) {
      console.error("Completion error:", error);
    }
  };

  const saveCacheWarmedInfo = () => {
    setCacheWarmedInfo({
      date: Date.now(),
      esqlGuideText,
      schemaGuideText,
      modelSelected,
    });
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading>ES|QL Composer</Heading>

        <Accordion defaultIndex={[1, 2, 3]} allowMultiple>
          <Section label="How to Use" color="green.50">
            <HowToUseArea
              tooltipsShown={tooltipsShown}
              setTooltipsShown={setTooltipsShown}
            />
          </Section>

          <Section label="LLM Access" color="cyan.50">
            <LLMConfigurationArea
              modelSelected={modelSelected}
              setModelSelected={setModelSelected}
              apiKey={apiKey}
              setApiKey={setApiKey}
              apiKeyWorks={apiKeyWorks}
              setApiKeyWorks={setApiKeyWorks}
              tooltipsShown={tooltipsShown}
              testAPIKey={testAPIKey}
            />
          </Section>

          <Section
            label="Reference Guides"
            color="yellow.50"
            headerElement={
              <CacheWarmedNotice
                cacheWarmedText={cacheWarmedText}
                tooltipsShown={tooltipsShown}
              />
            }
          >
            <ReferenceGuidesArea
              apiKey={apiKey}
              esqlGuideText={esqlGuideText}
              setEsqlGuideText={setEsqlGuideText}
              schemaGuideText={schemaGuideText}
              setSchemaGuideText={setSchemaGuideText}
              handleWarmCache={handleWarmCache}
              tooltipsShown={tooltipsShown}
            />
          </Section>

          <Section>
            <VStack align={"stretch"} justify={"space-between"} spacing={10}>
              <ESQLWorkingArea
                tooltipsShown={tooltipsShown}
                isESQLRequestAvailable={
                  (apiKey && esqlGuideText && schemaGuideText) !== ""
                }
                naturalInput={naturalInput}
                setNaturalInput={setNaturalInput}
                esqlInput={esqlInput}
                setEsqlInput={setEsqlInput}
                esqlCompletion={esqlCompletion}
                setEsqlCompletion={setEsqlCompletion}
                history={history}
                setHistory={setHistory}
                esqlCompleteButtonRef={esqlCompleteButtonRef}
                naturalInputRef={naturalInputRef}
                esqlInputRef={esqlInputRef}
                esqlCompletionRef={esqlCompletionRef}
                handleCompleteESQL={handleCompleteESQL}
                performESQLRequest={performESQLRequest}
              />
              <Statistics tooltipsShown={tooltipsShown} stats={allStats} />
            </VStack>
          </Section>
        </Accordion>
      </VStack>
    </Box>
  );
};

export default ESQLComposerMain;
