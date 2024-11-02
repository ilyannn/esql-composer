import autosize from "autosize";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import { Accordion, Box, Heading, VStack, useToast } from "@chakra-ui/react";

import Anthropic from "@anthropic-ai/sdk";

import {
  generateESQLUpdate,
  testWithSimpleQuestion,
  warmCache,
} from "../services/requests";

import CacheWarmedInfo from "./CacheWarmedInfo";
import HowToUse from "./HowToUse";
import LLMConfiguration from "./LLMConfiguration";
import MainArea from "./MainArea";
import ReferenceGuides from "./ReferenceGuides";
import Section from "./Section";
import Statistics from "./Statistics";

const Form = () => {
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

  const [allStats, setAllStats] = useState([]);
  const [history, setHistory] = useState([]);

  const [apiKeyWorks, setApiKeyWorks] = useState(null);
  const [cacheWarmedInfo, setCacheWarmedInfo] = useState(null);
  const [cacheWarmedText, setCacheWarmedText] = useState(null);

  const esqlInputRef = useRef(null);
  const esqlCompletionRef = useRef(null);
  const esqlCompleteButtonRef = useRef(null);
  const naturalInputRef = useRef(null);

  useEffect(() => {
    const defaultApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (defaultApiKey !== undefined) {
      setApiKey(defaultApiKey);
      if (naturalInputRef.current) {
        naturalInputRef.current.focus();
      }
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
            <HowToUse
              tooltipsShown={tooltipsShown}
              setTooltipsShown={setTooltipsShown}
            />
          </Section>

          <Section label="LLM Access" color="cyan.50">
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
          </Section>

          <Section
            label="Reference Guides"
            color="yellow.50"
            headerElement={
              <CacheWarmedInfo
                cacheWarmedText={cacheWarmedText}
                tooltipsShown={tooltipsShown}
              />
            }
          >
            <ReferenceGuides
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
              <MainArea
                tooltipsShown={tooltipsShown}
                isESQLRequestAvailable={
                  apiKey && esqlGuideText && schemaGuideText
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

export default Form;
