import autosize from "autosize";
import moment from "moment";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import {
  Accordion,
  Box,
  Divider,
  HStack,
  Heading,
  Link,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";

import Anthropic from "@anthropic-ai/sdk";

import type { HistoryRow, StatisticsRow } from "../common/types";

import {
  countTokens,
  generateESQLUpdate,
  reduceSize,
  testWithSimpleUtterance,
  warmCache,
} from "../services/llm";

import { TableData, QueryAPIError, performESQLQuery } from "../services/es";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import CacheWarmedNotice from "./components/CacheWarmedNotice";
import Section from "./components/Section";
import Statistics from "./components/Statistics";
import ESQLWorkingArea from "./ESQLWorkingArea";
import HowToUseArea, { Config } from "./HowToUseArea";
import LLMConfigurationArea from "./LLMConfigurationArea";
import QueryAPIConfigurationArea from "./QueryAPIConfigurationArea";
import ReferenceGuidesArea from "./ReferenceGuidesArea";
import QueryResultArea from "./QueryResultArea";

const ESQLComposerMain = () => {
  const toast = useToast();

  const [openedAreas, setOpenedAreas] = useState<number | number[]>([1, 2, 3]);
  const [tooltipsShown, setTooltipsShown] = useState(true);

  const [modelSelected, setModelSelected] = useState(0);
  const [anthropicAPIKey, setAnthropicAPIKey] = useState("");
  const [queryAPIURL, setQueryAPIURL] = useState("");
  const [queryAPIKey, setQueryAPIKey] = useState("");

  const [esqlGuideText, setEsqlGuideText] = useState("");
  const [schemaGuideText, setSchemaGuideText] = useState("");
  const [esqlGuideTokenCount, setEsqlGuideTokenCount] = useState<number | null>(
    null
  );
  const [schemaGuideTokenCount, setSchemaGuideTokenCount] = useState<
    number | null
  >(null);

  const [naturalInput, setNaturalInput] = useState("");
  const [esqlInput, setEsqlInput] = useState("");

  const [queryAPIData, setQueryAPIData] = useState<TableData | null>(null);
  const [queryAPIDataAutoUpdate, setQueryAPIDataAutoUpdate] = useState(false);
  const [queryAPIDataHasScheduledUpdate, setQueryAPIDataHasScheduledUpdate] =
    useState(false);

  const [allStats, setAllStats] = useState<StatisticsRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const [anthropicAPIKeyWorks, setAnthropicAPIKeyWorks] = useState<
    boolean | null
  >(null);
  const [queryAPIKeyWorks, setQueryAPIKeyWorks] = useState<boolean | null>(
    null
  );
  const [cacheWarmedInfo, setCacheWarmedInfo] = useState<any | null>(null);
  const [cacheWarmedText, setCacheWarmedText] = useState<string | null>(null);

  const esqlInputRef = useRef<HTMLTextAreaElement>(null);
  const esqlCompleteButtonRef = useRef<HTMLButtonElement>(null);
  const naturalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEsqlGuideTokenCount(null);
  }, [esqlGuideText]);

  useEffect(() => {
    setSchemaGuideTokenCount(null);
  }, [schemaGuideText]);

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

  const collectConfig = useCallback(() => {
    return {
      openedAreas,
      tooltipsShown,
      modelSelected,
      anthropicAPIKey,
      anthropicAPIKeyWorks,
      queryAPIURL,
      queryAPIKey,
      queryAPIKeyWorks,
      esqlGuideText,
      schemaGuideText,
    };
  }, [
    openedAreas,
    tooltipsShown,
    modelSelected,
    anthropicAPIKey,
    anthropicAPIKeyWorks,
    queryAPIURL,
    queryAPIKey,
    queryAPIKeyWorks,
    esqlGuideText,
    schemaGuideText,
  ]);

  const loadConfig = useCallback(
    (config: Config) => {
      if (
        "openedAreas" in config &&
        typeof config["openedAreas"] === "object" &&
        Array.isArray(config["openedAreas"])
      ) {
        setOpenedAreas(config["openedAreas"]);
      }
      if (
        "tooltipsShown" in config &&
        typeof config["tooltipsShown"] === "boolean"
      ) {
        setTooltipsShown(config["tooltipsShown"]);
      }
      if (
        "modelSelected" in config &&
        typeof config["modelSelected"] === "number"
      ) {
        setModelSelected(config["modelSelected"]);
      }
      if (
        "anthropicAPIKey" in config &&
        typeof config["anthropicAPIKey"] === "string"
      ) {
        setAnthropicAPIKey(config["anthropicAPIKey"]);
        setAnthropicAPIKeyWorks(null);
      }
      if (
        "anthropicAPIKeyWorks" in config &&
        typeof config["anthropicAPIKeyWorks"] === "boolean"
      ) {
        setAnthropicAPIKeyWorks(config["anthropicAPIKeyWorks"]);
      }
      if (
        "queryAPIURL" in config &&
        typeof config["queryAPIURL"] === "string"
      ) {
        setQueryAPIURL(config["queryAPIURL"]);
        setQueryAPIKeyWorks(null);
      }
      if (
        "queryAPIKey" in config &&
        typeof config["queryAPIKey"] === "string"
      ) {
        setQueryAPIKey(config["queryAPIKey"]);
        setQueryAPIKeyWorks(null);
      }
      if (
        "queryAPIKeyWorks" in config &&
        typeof config["queryAPIKeyWorks"] === "boolean"
      ) {
        setQueryAPIKeyWorks(config["queryAPIKeyWorks"]);
      }
      if (
        "esqlGuideText" in config &&
        typeof config["esqlGuideText"] === "string"
      ) {
        setEsqlGuideText(config["esqlGuideText"]);
      }
      if (
        "schemaGuideText" in config &&
        typeof config["schemaGuideText"] === "string"
      ) {
        setSchemaGuideText(config["schemaGuideText"]);
      }
    },
    [
      setTooltipsShown,
      setModelSelected,
      setAnthropicAPIKey,
      setEsqlGuideText,
      setSchemaGuideText,
    ]
  );

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
  const performAnthropicAPIAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      try {
        await action();
        setAnthropicAPIKeyWorks(true);
        return;
      } catch (error) {
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

        if (error instanceof Anthropic.APIError && error.status === 401) {
          setAnthropicAPIKeyWorks(false);
          description = <Text>Please check your Anthropic API key.</Text>;
        } else if (
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
    },
    [toast, setAnthropicAPIKeyWorks]
  );

  const performQueryAPIAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      try {
        await action();
        setQueryAPIKeyWorks(true);
        return;
      } catch (error) {
        let title: ReactNode = <Text>{label} error</Text>;
        let description: ReactNode = undefined;

        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof error.status === "number"
        ) {
          title = (
            <HStack>
              {title} <ExternalLinkIcon />
              <Link isExternal href={`https://http.dog/${error.status}`}>
                {error.status}
              </Link>
            </HStack>
          );
        }

        if (error instanceof QueryAPIError && error.isAuthorizationError) {
          setQueryAPIKeyWorks(false);
          description = <Text>Please check your Elasticsearch API key.</Text>;
        } else if (
          error &&
          typeof error === "object" &&
          "error" in error &&
          error.error &&
          typeof error.error === "object"
        ) {
          description = <Text>{String(error.error)}</Text>;
        } else {
          description = String(error);
        }

        toast({
          title,
          description,
          status: "error",
          isClosable: true,
        });
      }
    },
    [toast, setQueryAPIKeyWorks]
  );

  const testAnthropicAPIKey = async () => {
    await performAnthropicAPIAction("Anthropic API test", async () => {
      const utterance = "Hi, Claude";
      const claudeAnswer = await testWithSimpleUtterance({
        apiKey: anthropicAPIKey,
        modelSelected,
        utterance,
      });

      toast({
        title: "Anthropic API test successful",

        description: (
          <VStack align="stretch" spacing={0} justify={"flex-end"}>
            <Text> You say: {utterance}</Text>
            <Text> Claude says: {claudeAnswer}</Text>
          </VStack>
        ),
        status: "success",
        isClosable: true,
      });
    });
  };

  const handleWarmCache = async () => {
    await performAnthropicAPIAction("Cache warming", async () => {
      const data = await warmCache({
        apiKey: anthropicAPIKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
      });

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

  const handleReduceSize = async () => {
    let oldSize: number | undefined = undefined;

    await performAnthropicAPIAction("Token Counting", async () => {
      oldSize = await countTokens({
        apiKey: anthropicAPIKey,
        modelSelected,
        text: esqlGuideText,
      });
    });

    await performAnthropicAPIAction("Size reduction", async () => {
      let newESQGuideText = "";

      const processLine = (line: string) => {
        newESQGuideText += line + "\n";
        setEsqlGuideText(newESQGuideText);
      };

      const data = (await reduceSize({
        apiKey: anthropicAPIKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        processLine,
      })) as any;

      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();

      const newSize = await countTokens({
        apiKey: anthropicAPIKey,
        modelSelected,
        text: newESQGuideText,
      });
      setEsqlGuideTokenCount(newSize);

      const percentage = oldSize
        ? ((newSize / oldSize - 1) * 100).toFixed(0)
        : undefined;
      toast({
        title: "Size reduction successful",
        description: `ES|QL guide size has changed from ${oldSize} to ${newSize} tokens (${percentage}% change).`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    });
  };

  const handleGetTokenCount = useCallback(async () => {
    await performAnthropicAPIAction("Token Counting", async () => {
      setEsqlGuideTokenCount(
        await countTokens({
          apiKey: anthropicAPIKey,
          modelSelected,
          text: esqlGuideText,
        })
      );
      setSchemaGuideTokenCount(
        await countTokens({
          apiKey: anthropicAPIKey,
          modelSelected,
          text: schemaGuideText,
        })
      );
    });
  }, [
    performAnthropicAPIAction,
    anthropicAPIKey,
    modelSelected,
    esqlGuideText,
    schemaGuideText,
  ]);

  const saveCacheWarmedInfo = useCallback(() => {
    setCacheWarmedInfo({
      date: Date.now(),
      esqlGuideText,
      schemaGuideText,
      modelSelected,
    });
  }, [esqlGuideText, schemaGuideText, modelSelected]);

  const performESQLRequest = useCallback(
    async (text: string) => {
      await performAnthropicAPIAction("ES|QL generation", async () => {
        let interpolatedLines = esqlInput.split("\n");
        let lineIndex = -1;

        const haveESQLLine = (line: string) => {
          setAnthropicAPIKeyWorks(true);
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
          }
          if (esqlInputRef.current) {
            autosize.update(esqlInputRef.current);
          }
        };

        const data = await generateESQLUpdate({
          apiKey: anthropicAPIKey,
          modelSelected,
          esqlGuideText,
          schemaGuideText,
          esqlInput,
          naturalInput: text,
          haveESQLLine,
          doneESQL,
        });

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

        if (esqlInputRef.current) {
          autosize.update(esqlInputRef.current);
        }

        if (naturalInputRef.current?.value === text) {
          naturalInputRef.current?.setSelectionRange(0, naturalInput.length);
        }

        if (queryAPIDataAutoUpdate) {
          setQueryAPIDataHasScheduledUpdate(true);
        }
      });
    },
    [
      performAnthropicAPIAction,
      esqlInput,
      anthropicAPIKey,
      modelSelected,
      esqlGuideText,
      schemaGuideText,
      saveCacheWarmedInfo,
      allStats,
      history,
      naturalInput.length,
      queryAPIDataAutoUpdate,
      setQueryAPIDataHasScheduledUpdate,
    ]
  );

  const handleCompleteESQL = async () => {
    await performAnthropicAPIAction("ES|QL completion", async () => {
      if (esqlInputRef.current === null) {
        return;
      }

      const cursorPosition = esqlInputRef.current.selectionStart;
      const esqlBeforeCursor = esqlInput.substring(0, cursorPosition);

      let lineEnd = esqlInput.indexOf("\n", cursorPosition);
      if (lineEnd === -1) {
        lineEnd = esqlInput.length;
      }
      if (lineEnd > cursorPosition) {
        setEsqlInput(
          esqlInput.substring(0, cursorPosition) + esqlInput.substring(lineEnd)
        );
        if (esqlInputRef.current) {
          autosize.update(esqlInputRef.current);
          esqlInputRef.current.setSelectionRange(
            cursorPosition,
            cursorPosition,
          );
        }
      }

      const haveESQLLine = (line: string) => {
        setEsqlInput(
          esqlInput.substring(0, cursorPosition) +
            line +
            esqlInput.substring(lineEnd)
        );
        if (esqlInputRef.current) {
          autosize.update(esqlInputRef.current);
          esqlInputRef.current.setSelectionRange(
            cursorPosition + line.length,
            cursorPosition + line.length
          );
        }
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
      };

      const data = (await generateESQLUpdate({
        apiKey: anthropicAPIKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        esqlInput: esqlBeforeCursor,
        haveESQLLine,
      })) as any;
      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();
      if (queryAPIDataAutoUpdate) {
        setQueryAPIDataHasScheduledUpdate(true);
      }
    });
  };

  const fetchQueryData = useCallback(async () => {
    await performQueryAPIAction("ES|QL query", async () => {
      const response = await performESQLQuery({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
        query: esqlInput,
      });
      setQueryAPIData(response);
    });
  }, [queryAPIURL, queryAPIKey, esqlInput, performQueryAPIAction]);

  const handleShowInfo = async () => {
    await performQueryAPIAction("Elasticsearch API test", async () => {
      const response = await performESQLQuery({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
        query: "SHOW INFO",
      });
      const versionColumn = response.columns.findIndex(
        (col) => col.name === "version"
      );
      const dateColumn = response.columns.findIndex(
        (col) => col.name === "date"
      );
      const version = response.values[0][versionColumn] as string;
      const date = response.values[0][dateColumn] as string;
      const formattedMoment = moment(date).fromNow();
      toast({
        title: "Elasticsearch API test successful",
        description: (
          <Text>
            SHOW INFO: version {version}, built {formattedMoment}.{" "}
          </Text>
        ),
        status: "success",
        isClosable: true,
      });
    });
  };

  useEffect(() => {
    if (queryAPIDataHasScheduledUpdate) {
      setQueryAPIDataHasScheduledUpdate(false);
      fetchQueryData();
    }
  }, [queryAPIDataHasScheduledUpdate, fetchQueryData, esqlInput]);

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading>ES|QL Composer</Heading>

        <Accordion index={openedAreas} onChange={setOpenedAreas} allowMultiple>
          <Section label="How to Use" color="green.50">
            <HowToUseArea
              tooltipsShown={tooltipsShown}
              setTooltipsShown={setTooltipsShown}
              collectConfig={collectConfig}
              loadConfig={loadConfig}
            />
          </Section>

          <Section label="API Configuration" color="cyan.50">
            <VStack align={"stretch"} justify={"space-between"} spacing={6}>
              <LLMConfigurationArea
                modelSelected={modelSelected}
                setModelSelected={setModelSelected}
                apiKey={anthropicAPIKey}
                setApiKey={setAnthropicAPIKey}
                apiKeyWorks={anthropicAPIKeyWorks}
                setApiKeyWorks={setAnthropicAPIKeyWorks}
                tooltipsShown={tooltipsShown}
                testAPIKey={testAnthropicAPIKey}
              />
              <Divider />
              <QueryAPIConfigurationArea
                apiURL={queryAPIURL}
                setApiURL={setQueryAPIURL}
                apiKey={queryAPIKey}
                setApiKey={setQueryAPIKey}
                apiKeyWorks={queryAPIKeyWorks}
                setApiKeyWorks={setQueryAPIKeyWorks}
                tooltipsShown={tooltipsShown}
                handleShowInfo={handleShowInfo}
              />
            </VStack>
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
              apiKey={anthropicAPIKey}
              esqlGuideText={esqlGuideText}
              setEsqlGuideText={setEsqlGuideText}
              esqlGuideTokenCount={esqlGuideTokenCount}
              schemaGuideText={schemaGuideText}
              setSchemaGuideText={setSchemaGuideText}
              schemaGuideTokenCount={schemaGuideTokenCount}
              handleWarmCache={handleWarmCache}
              tooltipsShown={tooltipsShown}
              handleReduceSize={handleReduceSize}
              handleGetTokenCount={handleGetTokenCount}
            />
          </Section>

          <Section label="ES|QL Query">
            <VStack align={"stretch"} justify={"space-between"} spacing={10}>
              <ESQLWorkingArea
                tooltipsShown={tooltipsShown}
                isESQLRequestAvailable={
                  (anthropicAPIKey && esqlGuideText && schemaGuideText) !== ""
                }
                naturalInput={naturalInput}
                setNaturalInput={setNaturalInput}
                esqlInput={esqlInput}
                setEsqlInput={setEsqlInput}
                history={history}
                esqlCompleteButtonRef={esqlCompleteButtonRef}
                naturalInputRef={naturalInputRef}
                esqlInputRef={esqlInputRef}
                handleCompleteESQL={handleCompleteESQL}
                performESQLRequest={performESQLRequest}
                isQueryAPIAvailable={
                  queryAPIURL.length > 0 && queryAPIKey.length > 0
                }
                resetESQL={() => {
                  setNaturalInput("");
                  setEsqlInput("");
                  setQueryAPIData(null);
                  setQueryAPIDataAutoUpdate(false);
                }}
                fetchQueryData={fetchQueryData}
              />
              <QueryResultArea
                data={queryAPIData}
                tooltipsShown={tooltipsShown}
                clearData={() => {
                  setQueryAPIDataAutoUpdate(false);
                  setQueryAPIData(null);
                }}
                autoUpdate={queryAPIDataAutoUpdate}
                setAutoUpdate={setQueryAPIDataAutoUpdate}
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
