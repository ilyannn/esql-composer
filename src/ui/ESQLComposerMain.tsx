import moment from "moment";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInterval } from "usehooks-ts";

import {
  Accordion,
  Box,
  HStack,
  Heading,
  Link,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import Anthropic from "@anthropic-ai/sdk";

import type { LLMHistoryRow, LLMStatisticsRow } from "../common/types";
import {
  BlockHasStableId,
  ESQLBlock,
  LimitBlock,
} from "../models/esql/ESQLBlock";
import {
  ESQLChain,
  ESQLChainAction,
  createInitialChain,
  esqlChainAddToString,
  performChainAction,
} from "../models/esql/ESQLChain";
import {
  ValueStatistics,
  countRawValuesWithCount,
} from "../models/esql/ValueStatistics";

import {
  FieldInfo,
  countTokens,
  generateESQLUpdate,
  reduceSize,
  testWithSimpleUtterance,
  transformField,
  warmCache,
} from "../services/llm";

import { ESQLSchema, deriveSchema } from "../services/es/derive_schema";
import {
  performESQLQuery,
  performESQLShowInfoQuery,
} from "../services/es/esql_query";
import { ESQLTableData, QueryAPIError } from "../services/es/types";
import {
  useTracing,
  type UseTracingCallback,
} from "../services/tracing/use_tracing";

import { loadFile } from "../services/files";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import { add, chain, get, reduce, set } from "lodash";
import {
  TracingOptions,
  defaultTracingOptions,
} from "../common/tracing-options";

import { ESQLAtomRawValue } from "../models/esql/esql_types";
import CacheWarmedNotice from "./components/CacheWarmedNotice";
import Section from "./components/Section";
import Statistics from "./components/Statistics";
import ESQLWorkingArea from "./ESQLWorkingArea";
import HowToUseArea, { Config } from "./HowToUseArea";
import LLMConfigurationArea from "./LLMConfigurationArea";
import GetSchemaModal from "./modals/GetSchemaModal";
import QueryAPIConfigurationArea from "./QueryAPIConfigurationArea";
import QueryResultArea from "./QueryResultArea";
import ReferenceGuidesArea from "./ReferenceGuidesArea";
import VisualComposer from "./visual-composer/VisualComposer";
import { representESQLField } from "../models/esql/esql_repr";
import { ComposerBlockAction } from "./visual-composer/ComposerBlock";

const defaultESQLGuidePromise = loadFile("esql-short.txt");

const ESQLComposerMain = () => {
  const toast = useToast();

  const [openedAreas, setOpenedAreas] = useState<number | number[]>([
    0, 1, 2, 3,
  ]);
  const [tooltipsShown, setTooltipsShown] = useState(false);

  const [modelSelected, setModelSelected] = useState(0);
  const [anthropicAPIKey, setAnthropicAPIKey] = useState("");
  const [queryAPIURL, _setQueryAPIURL] = useState("");
  const [queryAPIKey, _setQueryAPIKey] = useState("");
  const [queryAPIInfo, setQueryAPIInfo] = useState<Record<
    string,
    string
  > | null>(null);
  const [esqlGuideText, setEsqlGuideText] = useState("");
  const [esqlSchema, _setEsqlSchema] = useState<ESQLSchema | null>(null);

  const [tracingOptions, setTracingOptions] = useState<TracingOptions>(
    defaultTracingOptions
  );

  const schemaGuideText = esqlSchema?.guide || "";

  // Inspired by https://react.dev/learn/you-might-not-need-an-effect#fetching-data
  const [esqlGuideTokenCount, setEsqlGuideTokenCount] = useState<
    [string, number] | null
  >(null);
  const [schemaGuideTokenCount, setSchemaGuideTokenCount] = useState<
    [string, number] | null
  >(null);

  const [naturalInput, setNaturalInput] = useState("");
  const [esqlInput, setEsqlInput] = useState("");
  const [visualChain, setVisualChain] = useState<ESQLChain>(createInitialChain);
  const [minimizedLimitBlock, setMinimizedLimitBlock] = useState<
    LimitBlock & BlockHasStableId | undefined
  >(undefined);
  const [updatingESQLLineByLine, setUpdatingESQLLineByLine] = useState(false);

  const [queryAPIData, setQueryAPIData] = useState<ESQLTableData | null>(null);
  const [queryAPIDataAutoUpdate, _setQueryAPIDataAutoUpdate] = useState(false);

  const [allStats, setAllStats] = useState<LLMStatisticsRow[]>([]);
  const [history, setHistory] = useState<LLMHistoryRow[]>([]);

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

  const isElasticsearchAPIAvailable = (queryAPIURL && queryAPIKey) !== "";
  const isESQLRequestAvailable =
    anthropicAPIKey.length !== 0 &&
    esqlGuideText.length !== 0 &&
    esqlSchema !== null &&
    esqlSchema.guide !== "";

  const getSchemaProps = useDisclosure();

  useEffect(() => {
    if (!cacheWarmedInfo) {
      return;
    }
    if (
      cacheWarmedInfo.esqlGuideText === esqlGuideText &&
      cacheWarmedInfo.schemaGuideText === esqlSchema?.guide &&
      cacheWarmedInfo.modelSelected === modelSelected
    ) {
      return;
    }
    setCacheWarmedInfo(null);
  }, [modelSelected, esqlGuideText, esqlSchema, cacheWarmedInfo]);

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
      esqlSchema,
      tracingOptions,
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
    esqlSchema,
    tracingOptions,
  ]);

  const setSchemaGuideText = useCallback(
    (value: string) => {
      _setEsqlSchema({
        ...(esqlSchema ?? {
          indexPattern: "",
          knownFields: [],
          guide: "",
          initialESQL: "",
          initialActions: [],
        }),
        guide: value,
      });
    },
    [esqlSchema]
  );

  const setQueryAPIURL = useCallback(
    (value: string) => {
      _setQueryAPIURL(value);
      setQueryAPIKeyWorks(null);
      setQueryAPIInfo(null);
    },
    [_setQueryAPIURL]
  );

  const setQueryAPIKey = useCallback((value: string) => {
    _setQueryAPIKey(value);
    setQueryAPIKeyWorks(null);
  }, []);

  const getCompleteESQL = useCallback(() => {
    const chain =
      minimizedLimitBlock !== undefined
        ? [...visualChain, minimizedLimitBlock]
        : visualChain;
    return esqlChainAddToString(esqlInput, chain);
  }, [esqlInput, visualChain, minimizedLimitBlock]);

  /**
   * Handles API errors and updates the state of apiKeyWorks.
   *
   * Stores the information about the authentication success or failure.
   * Displays a toast if the API call fails and it's not an authentication failure.
   *
   * @param {string} label - The action being performed, used in error messages.
   * @param {Function} action - The function that performs the API call; takes tracing argument.
   * @returns {Promise<*>} The result of the API call if successful.
   */
  const performAnthropicAPIAction = useCallback(
    async (
      label: string,
      action: (addToSpan: UseTracingCallback) => Promise<void>
    ) => {
      const { addToSpan, saveSpan } = useTracing({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
        option: tracingOptions.llm,
      });

      try {
        await action(addToSpan);
        setAnthropicAPIKeyWorks(true);
        return;
      } catch (error) {
        console.error(`Error when ${label}`, error);

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

        addToSpan({ error: { message: description } });
      } finally {
        saveSpan();
      }
    },
    [toast, queryAPIURL, queryAPIKey, tracingOptions.llm]
  );

  const performQueryAPIAction = useCallback(
    async (
      label: string,
      action: (addToSpan: UseTracingCallback) => Promise<void>
    ) => {
      const { addToSpan, saveSpan } = useTracing({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
        option: tracingOptions.es,
      });

      try {
        await action(addToSpan);
        setQueryAPIKeyWorks(true);
      } catch (error) {
        console.error(`Error when ${label}`, error);

        let title: ReactNode = <Text>{label} error</Text>;
        let description: ReactNode = undefined;

        _setQueryAPIDataAutoUpdate(false);

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

        addToSpan({ error: { message_j: description } });
      } finally {
        saveSpan();
      }
    },
    [toast, queryAPIURL, queryAPIKey, tracingOptions.es]
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
        schemaGuideText: schemaGuideText,
      });

      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();

      toast({
        title: "Cache warming successful",
        description: `Cache will now provide ${
          data.stats.saved_to_cache + data.stats.input_cached
        } tokens for requests using these guides.`,
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
        esqlGuideText: esqlGuideText,
        schemaGuideText: schemaGuideText,
        processLine,
      })) as any;

      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();

      const newSize = await countTokens({
        apiKey: anthropicAPIKey,
        modelSelected,
        text: newESQGuideText,
      });
      setEsqlGuideTokenCount([newESQGuideText, newSize]);

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
    if (!esqlGuideText || !schemaGuideText) {
      return;
    }
    await performAnthropicAPIAction("Token Counting", async () => {
      setEsqlGuideTokenCount([
        esqlGuideText,
        await countTokens({
          apiKey: anthropicAPIKey,
          modelSelected,
          text: esqlGuideText,
        }),
      ]);
      setSchemaGuideTokenCount([
        schemaGuideText,
        await countTokens({
          apiKey: anthropicAPIKey,
          modelSelected,
          text: schemaGuideText,
        }),
      ]);
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

  const currentQueryAPIActionQuery = useRef<string | null>(null);

  const fetchQueryData = useCallback(async () => {
    await performQueryAPIAction("ES|QL query", async (addToSpan) => {
      const fullESQL = getCompleteESQL();

      if (currentQueryAPIActionQuery.current === fullESQL) {
        // Already fetching this query.
        return;
      }

      currentQueryAPIActionQuery.current = fullESQL;
      addToSpan({ esql: { query: fullESQL } });

      try {
        const response = await performESQLQuery({
          apiURL: queryAPIURL,
          apiKey: queryAPIKey,
          query: fullESQL,
        });

        if (currentQueryAPIActionQuery.current === fullESQL) {
          setQueryAPIData(response.data);
          addToSpan({ stats: response.stats });
        }
      } finally {
        currentQueryAPIActionQuery.current = null;
      }
    });
  }, [
    queryAPIURL,
    queryAPIKey,
    esqlInput,
    visualChain,
    performQueryAPIAction,
    getCompleteESQL,
  ]);

  const performQueryAPIDataAutoUpdate = useCallback(
    (force?: boolean) => {
      // console.log(
      //   "performQueryAPIDataAutoUpdate",
      //   isESQLRequestAvailable,
      //   queryAPIKey.slice(0, 5),
      //   queryAPIDataAutoUpdate
      // );
      if (isESQLRequestAvailable && !updatingESQLLineByLine) {
        if (queryAPIDataAutoUpdate || force === true) {
          fetchQueryData();
        }
      }
    },
    [
      isESQLRequestAvailable,
      updatingESQLLineByLine,
      queryAPIDataAutoUpdate,
      fetchQueryData,
    ]
  );

  useEffect(() => {
    performQueryAPIDataAutoUpdate();
  }, [performQueryAPIDataAutoUpdate, esqlInput, visualChain]);

  const setQueryAPIDataAutoUpdate = useCallback(
    (value: boolean) => {
      _setQueryAPIDataAutoUpdate(value);
      if (value) {
        performQueryAPIDataAutoUpdate(value);
      }
    },
    [performQueryAPIDataAutoUpdate]
  );

  const splitVisualChainAndLimit = useCallback(
    (chain: ESQLChain): [ESQLChain, LimitBlock & BlockHasStableId| undefined] => {
      // This value only needs to be changed if limit is minimized.
      if (minimizedLimitBlock !== undefined) {
        const lastBlock = chain.length > 0 ? chain[chain.length - 1] : null;
        const shouldSplitLimit = lastBlock && lastBlock.command === "LIMIT";

        if (shouldSplitLimit) {
          return [
            visualChain.slice(0, visualChain.length - 1),
            lastBlock,
          ];
        }
      }

      return [chain, undefined];
    },
    [minimizedLimitBlock]
  );

  const _resetESQL = useCallback(
    (
      initialESQL: string | undefined,
      initialActions: ESQLChainAction[] | undefined
    ) => {
      setNaturalInput("");
      setQueryAPIData(null);
      setQueryAPIDataAutoUpdate(false);

      const esql = initialESQL || "";
      setEsqlInput(esql + "\n");
      const initialChain = reduce(
        initialActions,
        (chain: ESQLChain, action) =>
          performChainAction(chain, action, []).chain,
        createInitialChain()
      );

      const [newChain, newMinimizedLimitBlock] =
        splitVisualChainAndLimit(initialChain);
      setVisualChain(newChain);
      setMinimizedLimitBlock(newMinimizedLimitBlock);
    },
    []
  );

  const setEsqlSchema = useCallback(
    (schema: ESQLSchema | null) => {
      _setEsqlSchema(schema);
      _resetESQL(schema?.initialESQL, schema?.initialActions);
    },
    [_resetESQL]
  );

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
      }
      if (
        "queryAPIKey" in config &&
        typeof config["queryAPIKey"] === "string"
      ) {
        setQueryAPIKey(config["queryAPIKey"]);
        if (
          "queryAPIKeyWorks" in config &&
          typeof config["queryAPIKeyWorks"] === "boolean"
        ) {
          setQueryAPIKeyWorks(config["queryAPIKeyWorks"]);
        }
      }
      if (
        "esqlGuideText" in config &&
        typeof config["esqlGuideText"] === "string"
      ) {
        setEsqlGuideText(config["esqlGuideText"]);
      }
      if ("esqlSchema" in config && typeof config["esqlSchema"] === "object") {
        setEsqlSchema(config["esqlSchema"]);
      }
      if (
        "tracingOptions" in config &&
        typeof config["tracingOptions"] === "object"
      ) {
        setTracingOptions({
          ...defaultTracingOptions,
          ...config["tracingOptions"],
        });
      }
    },
    [setQueryAPIURL, setQueryAPIKey, setEsqlSchema]
  );

  const resetESQL = useCallback(() => {
    _resetESQL(esqlSchema?.indexPattern, esqlSchema?.initialActions || []);
  }, [_resetESQL, esqlSchema]);

  const performESQLRequest = useCallback(
    async (text: string) => {
      if (!esqlGuideText || !schemaGuideText) {
        return;
      }
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
        };

        const doneESQL = () => {
          lineIndex++;
          if (lineIndex < interpolatedLines.length) {
            interpolatedLines.splice(lineIndex);
            setEsqlInput(interpolatedLines.join("\n"));
          }
          setUpdatingESQLLineByLine(false);
        };
        setUpdatingESQLLineByLine(true);

        const data = await generateESQLUpdate({
          type: "update",
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

        if (naturalInputRef.current?.value === text) {
          naturalInputRef.current?.setSelectionRange(0, naturalInput.length);
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
    ]
  );

  const handleCompleteESQL = async () => {
    await performAnthropicAPIAction("ES|QL completion", async () => {
      if (
        esqlInputRef.current === null ||
        esqlGuideText === null ||
        schemaGuideText === null
      ) {
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
          esqlInputRef.current.setSelectionRange(
            cursorPosition,
            cursorPosition
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
        type: "completion",
        apiKey: anthropicAPIKey,
        modelSelected,
        esqlGuideText,
        schemaGuideText,
        esqlInput: esqlBeforeCursor,
        haveESQLLine,
      })) as any;
      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();
      performQueryAPIDataAutoUpdate();
    });
  };

  const handleTransformFieldWithInfo = useCallback(
    async (sourceField: FieldInfo, naturalInput: string) => {
      await performAnthropicAPIAction(
        "ES|QL field transform",
        async (addToSpan) => {
          const fullEsqlQuery = getCompleteESQL();
          addToSpan({
            esql: {
              action: "eval",
              query: fullEsqlQuery,
              source: sourceField,
            },
          });

          const doneEvalExpression = (field: string, expr: string) => {
            addToSpan({
              esql: {
                target: field,
                expression: expr,
              },
            });
            const { chain } = performChainAction(
              visualChain,
              {
                action: "eval",
                sourceField: sourceField.name,
                expressions: [{ field, expression: expr }],
              },
              []
            );
            setVisualChain(chain);
          };

          const data = (await transformField({
            type: "transformation",
            apiKey: anthropicAPIKey,
            modelSelected,
            esqlGuideText,
            schemaGuideText,
            esqlInput: fullEsqlQuery,
            sourceFields: [sourceField],
            naturalInput,
            doneEvalExpression,
          })) as any;

          addToSpan(data);
          setAllStats([...allStats, data.stats]);
        }
      );
    },
    [
      performAnthropicAPIAction,
      anthropicAPIKey,
      modelSelected,
      esqlGuideText,
      schemaGuideText,
      allStats,
      getCompleteESQL,
    ]
  );

  const handleShowInfo = async () => {
    await performQueryAPIAction("Elasticsearch API test", async () => {
      const info = await performESQLShowInfoQuery({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
      });
      const formattedMoment = moment(info.date).fromNow();
      toast({
        title: "Elasticsearch API test successful",
        description: (
          <Text>
            SHOW INFO: version {info.version}, built {formattedMoment}.{" "}
          </Text>
        ),
        status: "success",
        isClosable: true,
      });
      setQueryAPIInfo({
        version: info.version,
        built: formattedMoment,
        hash: info.hash,
      });
    });
  };

  const handleGetSchemaFromES = async (
    indexPattern: string,
    randomSamplingFactor: number
  ) => {
    await performQueryAPIAction("Generate schema", async () => {
      const schema = await deriveSchema({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
        indexPattern,
        randomSamplingFactor,
      });
      setEsqlSchema(schema);
    });
  };

  useEffect(() => {
    let ignore = false;

    defaultESQLGuidePromise.then((data) => {
      if (!ignore) {
        setEsqlGuideText(data);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const handleChainAction = useCallback((
    action: ESQLChainAction,
    knownFields: string[]
  ): boolean => {
    try {
      const { chain } = performChainAction(visualChain, action, knownFields);
      setVisualChain(chain);
      return true;
    } catch (error) {
      return false;
    }
  }, [visualChain]);

  const handleUnminimizeLimitBlock = useCallback(() => {
    if (minimizedLimitBlock) {
      setVisualChain([...visualChain, minimizedLimitBlock]);
      setMinimizedLimitBlock(undefined);
    }
  }, [visualChain, minimizedLimitBlock]);

  const updateVisualBlock = useCallback((index: number, block: ESQLBlock) => {
    const blocks = [...visualChain];
    const blockWIthID: ESQLBlock & BlockHasStableId = {
      ...block,
      stableId: blocks[index].stableId,
    };
    blocks[index] = blockWIthID;
    setVisualChain(blocks);
  }, [visualChain]);

  const handleVisualBlockAction = useCallback((
    index: number,
    action: ComposerBlockAction
  ) => {
    const block = visualChain[index];

    // Special case of the limit block.
    if (index == visualChain.length - 1 && block.command === "LIMIT") {
      setMinimizedLimitBlock(block);
    }

    switch (action) {
      case "accept":
        const newESQL = esqlChainAddToString(
          esqlInput,
          visualChain.slice(0, index + 1)
        );
        setEsqlInput(newESQL);
        setVisualChain(visualChain.slice(index + 1));
        break;
      case "reject":
        setVisualChain([
          ...visualChain.slice(0, index),
          ...visualChain.slice(index + 1),
        ]);
        break;
    }
  }, [esqlInput, visualChain]);

  const handleGlobalTopStats = useCallback(
    async (
      index: number,
      fieldName: string,
      topN: number
    ): Promise<ValueStatistics | undefined> => {
      let stats: ValueStatistics | undefined = undefined;

      await performQueryAPIAction(
        `Top ${topN} values for ${fieldName}`,
        async () => {
          const queryESQL = esqlChainAddToString(
            esqlInput,
            visualChain.slice(0, index)
          );

          const countCol = fieldName === "c" ? "cc" : "c";

          const totalCountResponse = await performESQLQuery({
            apiURL: queryAPIURL,
            apiKey: queryAPIKey,
            query: `${queryESQL}\n| stats ${countCol}=count()`,
          });
          const escapedFieldName = representESQLField(fieldName);
          const query = `${queryESQL}\n| stats ${countCol}=count() by ${escapedFieldName}\n| sort ${countCol} desc\n | KEEP ${escapedFieldName}, ${countCol} | LIMIT ${topN}`;

          const response = await performESQLQuery({
            apiURL: queryAPIURL,
            apiKey: queryAPIKey,
            query,
          });

          if (response && response.data.values) {
            const values_counts = response.data.values as [
              ESQLAtomRawValue,
              number
            ][];
            stats = countRawValuesWithCount(values_counts);

            if (totalCountResponse) {
              const values = totalCountResponse.data.values;
              if (values && values[0] && typeof values[0][0] === "number") {
                stats.totalCount = values[0][0];
              }
            }
          }
        }
      );

      return stats;
    },
    [performQueryAPIAction, queryAPIURL, queryAPIKey, esqlInput, visualChain]
  );

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack justify={"space-between"}>
          <Heading>ES|QL Composer</Heading>
          <HowToUseArea
            tooltipsShown={tooltipsShown}
            setTooltipsShown={setTooltipsShown}
            llmTracingOption={tracingOptions.llm}
            setLLMTracingOption={(value) =>
              setTracingOptions({ ...tracingOptions, llm: value })
            }
            esTracingOption={tracingOptions.es}
            setESTracingOption={(value) =>
              setTracingOptions({ ...tracingOptions, es: value })
            }
            collectConfig={collectConfig}
            loadConfig={loadConfig}
          />
        </HStack>
        <Accordion index={openedAreas} onChange={setOpenedAreas} allowMultiple>
          <Section label="LLM Configuration" color="orange.50">
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
              <Statistics tooltipsShown={tooltipsShown} stats={allStats} />
            </VStack>
          </Section>

          <Section label="Elasticsearch Configuration" color="teal.50">
            <VStack align={"stretch"} justify={"space-between"} spacing={6}>
              <QueryAPIConfigurationArea
                apiURL={queryAPIURL}
                info={queryAPIInfo}
                setApiURL={setQueryAPIURL}
                apiKey={queryAPIKey}
                setApiKey={setQueryAPIKey}
                apiKeyWorks={queryAPIKeyWorks}
                tooltipsShown={tooltipsShown}
                handleShowInfo={handleShowInfo}
              />
            </VStack>
          </Section>
          <Section
            label="Reference Materials"
            color="purple.50"
            headerElement={
              <CacheWarmedNotice
                cacheWarmedText={cacheWarmedText}
                tooltipsShown={tooltipsShown}
              />
            }
          >
            <ReferenceGuidesArea
              isESQLRequestAvailable={isESQLRequestAvailable}
              isElasticsearchAPIAvailable={isElasticsearchAPIAvailable}
              esqlGuideText={esqlGuideText}
              setEsqlGuideText={setEsqlGuideText}
              esqlGuideTokenCount={esqlGuideTokenCount}
              schemaGuideText={schemaGuideText}
              setSchemaGuideText={setSchemaGuideText}
              setSchemaGuideJSON={setEsqlSchema}
              schemaGuideTokenCount={schemaGuideTokenCount}
              handleWarmCache={handleWarmCache}
              tooltipsShown={tooltipsShown}
              handleReduceSize={handleReduceSize}
              handleGetTokenCount={handleGetTokenCount}
              handleRetrieveSchemaFromES={getSchemaProps.onOpen}
            />
          </Section>

          <Section label="ES|QL Workbench">
            <VStack align={"stretch"} justify={"space-between"} spacing={4}>
              <ESQLWorkingArea
                tooltipsShown={tooltipsShown}
                isESQLRequestAvailable={isESQLRequestAvailable}
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
                resetESQL={resetESQL}
              />
              <VisualComposer
                key="VisualComposer"
                chain={visualChain}
                updateBlock={(index, block) => updateVisualBlock(index, block)}
                handleBlockAction={(index, action) => {
                  handleVisualBlockAction(index, action);
                }}
                getGlobalTopStats={handleGlobalTopStats}
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
                handleChainActionInContext={handleChainAction}
                isFetchAvailable={
                  isElasticsearchAPIAvailable && esqlInput.length > 0
                }
                handleTransformFieldWithInfo={handleTransformFieldWithInfo}
                limitValue={minimizedLimitBlock?.limit}
                handleUnminimizeLimitBlock={handleUnminimizeLimitBlock}
                updatingESQLLineByLine={updatingESQLLineByLine}
                fetchQueryData={fetchQueryData}
              />
            </VStack>
          </Section>
        </Accordion>
      </VStack>
      <GetSchemaModal
        isOpen={getSchemaProps.isOpen}
        onClose={getSchemaProps.onClose}
        getSchemaFromES={handleGetSchemaFromES}
      />
    </Box>
  );
};

export default ESQLComposerMain;
