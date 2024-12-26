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

import type { LLMStatisticsRow } from "../common/types";
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
  generateESQLUpdate,
  reduceSize,
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

import { ExternalLinkIcon } from "@chakra-ui/icons";
import _, { reduce } from "lodash";
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
import {
  defaultLLMConfig,
  FullLLMConfig,
  isLLMConfigSufficent,
  AvailableLLMConfigs,
} from "../services/llm/config";
import { createLLMAdapter } from "../services/llm/adapters";
import { LLMAdapter } from "../services/llm/adapters/types";
import { DemoItem, MissingDemoContext } from "../services/es/demo";
import { checkIndexExists, createIndex } from "../services/es/indices";
import axios from "axios";

const defaultESQLGuidePromise = axios.get("esql-short.txt");

interface CacheWarmedInfo {
  date: number;
  esqlGuideText: string;
  schemaGuideText: string;
  selectedLLMConfig: AvailableLLMConfigs;
}

const ESQLComposerMain = () => {
  const toast = useToast();

  const [openedAreas, setOpenedAreas] = useState<number | number[]>([
    0, 1, 2, 3,
  ]);
  const [tooltipsShown, setTooltipsShown] = useState(false);

  const [llmConfig, setLLMConfig] = useState<FullLLMConfig>(defaultLLMConfig);
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
    (LimitBlock & BlockHasStableId) | undefined
  >(undefined);
  const [updatingESQLLineByLine, setUpdatingESQLLineByLine] = useState(false);

  const [queryAPIData, setQueryAPIData] = useState<ESQLTableData | null>(null);
  const [queryAPIDataAutoUpdate, _setQueryAPIDataAutoUpdate] = useState(false);

  const [allStats, setAllStats] = useState<LLMStatisticsRow[]>([]);

  const [anthropicAPIKeyWorks, setAnthropicAPIKeyWorks] = useState<
    boolean | null
  >(null);
  const [queryAPIKeyWorks, setQueryAPIKeyWorks] = useState<boolean | null>(
    null
  );
  const [cacheWarmedInfo, setCacheWarmedInfo] =
    useState<CacheWarmedInfo | null>(null);
  const [cacheWarmedText, setCacheWarmedText] = useState<string | null>(null);

  const esqlInputRef = useRef<HTMLTextAreaElement>(null);
  const esqlCompleteButtonRef = useRef<HTMLButtonElement>(null);
  const naturalInputRef = useRef<HTMLInputElement>(null);

  const isElasticsearchAPIAvailable = (queryAPIURL && queryAPIKey) !== "";

  const selectedLLMConfig: AvailableLLMConfigs = useMemo(() => {
    return llmConfig[llmConfig.selected];
  }, [llmConfig]);

  const isLLMRequestAvailable = isLLMConfigSufficent(llmConfig);
  const isLLMESQLRequestAvailable =
    isLLMRequestAvailable &&
    esqlGuideText.length !== 0 &&
    esqlSchema !== null &&
    esqlSchema.guide !== "";

  const getSchemaProps = useDisclosure();
  const isCacheWarmed =
    cacheWarmedInfo !== null &&
    cacheWarmedInfo.esqlGuideText === esqlGuideText &&
    cacheWarmedInfo.schemaGuideText === esqlSchema?.guide &&
    _.isEqual(cacheWarmedInfo.selectedLLMConfig, selectedLLMConfig);

  const updateCacheWarmedText = () => {
    if (!isCacheWarmed) {
      setCacheWarmedText(null);
      return;
    }
    const { date } = cacheWarmedInfo;
    const fromNow = moment(date).fromNow();
    setCacheWarmedText(`cached ${fromNow}`);
  };

  useEffect(updateCacheWarmedText, [cacheWarmedInfo, isCacheWarmed]);
  useInterval(updateCacheWarmedText, 5 * 1000);

  const collectConfig = useCallback(() => {
    return {
      llmConfig,
      openedAreas,
      tooltipsShown,
      queryAPIURL,
      queryAPIKey,
      queryAPIKeyWorks,
      esqlGuideText,
      esqlSchema,
      tracingOptions,
    };
  }, [
    llmConfig,
    openedAreas,
    tooltipsShown,
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
  const performLLMAction = useCallback(
    async (
      label: string,
      action: (
        adapter: LLMAdapter,
        addToSpan: UseTracingCallback
      ) => Promise<void>
    ) => {
      const adapter = createLLMAdapter(llmConfig);

      const { addToSpan, saveSpan } = useTracing({
        apiURL: queryAPIURL,
        apiKey: queryAPIKey,
        option: tracingOptions.llm,
      });

      try {
        await action(adapter, addToSpan);
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

  const handlePerformLLMTest = async () => {
    await performLLMAction("LLM API test", async (llmAdapter, _) => {
      const utterance = "Hi, are you an LLM?";
      const llmAnswer = await llmAdapter.answer(utterance);

      toast({
        title: "LLM API test successful",

        description: (
          <VStack align="stretch" spacing={0} justify={"flex-end"}>
            <Text> You say: {utterance}</Text>
            <Text> LLM says: {llmAnswer}</Text>
          </VStack>
        ),
        status: "success",
        isClosable: true,
      });
    });
  };

  const handleWarmCache = async () => {
    await performLLMAction("Cache warming", async () => {
      const data = await warmCache({
        apiKey: llmConfig.anthropic.apiKey,
        modelName: llmConfig.anthropic.modelName,
        esqlGuideText,
        schemaGuideText,
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
    await performLLMAction("Size reduction", async (llmAdapter) => {
      if (!llmAdapter.countTokens) {
        throw new Error(
          `Counting tokens is not supported by the '${llmConfig.selected}' LLM adapter.`
        );
      }

      const oldSize = await llmAdapter.countTokens(esqlGuideText);

      let newESQGuideText = "";

      const processLine = (line: string) => {
        newESQGuideText += `${line  }\n`;
        setEsqlGuideText(newESQGuideText);
      };

      const data = (await reduceSize({
        apiKey: llmConfig.anthropic.apiKey,
        modelName: llmConfig.anthropic.modelName,
        esqlGuideText,
        schemaGuideText,
        processLine,
      })) as any;

      setAllStats([...allStats, data.stats]);
      saveCacheWarmedInfo();

      const newSize = await llmAdapter.countTokens(newESQGuideText);
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
    await performLLMAction("Token Counting", async (llmAdapter) => {
      if (!llmAdapter.countTokens) {
        throw new Error(
          `Counting tokens is not supported by the '${llmConfig.selected}' LLM adapter.`
        );
      }

      if (esqlGuideText) {
        setEsqlGuideTokenCount([
          esqlGuideText,
          await llmAdapter.countTokens(esqlGuideText),
        ]);
      }

      if (schemaGuideText) {
        setSchemaGuideTokenCount([
          schemaGuideText,
          await llmAdapter.countTokens(schemaGuideText),
        ]);
      }
    });
  }, [performLLMAction, llmConfig, esqlGuideText, schemaGuideText]);

  const saveCacheWarmedInfo = useCallback(() => {
    setCacheWarmedInfo({
      date: Date.now(),
      esqlGuideText,
      schemaGuideText,
      selectedLLMConfig,
    });
  }, [esqlGuideText, schemaGuideText, selectedLLMConfig]);

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
      if (isElasticsearchAPIAvailable && !updatingESQLLineByLine) {
        if (queryAPIDataAutoUpdate || force === true) {
          fetchQueryData();
        }
      }
    },
    [
      isElasticsearchAPIAvailable,
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
    (
      chain: ESQLChain
    ): [ESQLChain, (LimitBlock & BlockHasStableId) | undefined] => {
      // This value only needs to be changed if limit is minimized.
      if (minimizedLimitBlock !== undefined) {
        const lastBlock = chain.length > 0 ? chain[chain.length - 1] : null;
        const shouldSplitLimit = lastBlock && lastBlock.command === "LIMIT";

        if (shouldSplitLimit) {
          return [visualChain.slice(0, visualChain.length - 1), lastBlock];
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

      const esql = initialESQL || "";
      if (esql.length === 0) {
        setQueryAPIDataAutoUpdate(false);
      }
      setEsqlInput(`${esql  }\n`);

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
      if ("llmConfig" in config && typeof config["llmConfig"] === "object") {
        const newConfig = _.merge(
          _.cloneDeep(defaultLLMConfig),
          config["llmConfig"]
        );
        setLLMConfig(newConfig);
      }
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
      await performLLMAction("ES|QL generation", async () => {
        const interpolatedLines = esqlInput.split("\n");
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
          apiKey: llmConfig.anthropic.apiKey,
          modelName: llmConfig.anthropic.modelName,
          esqlGuideText,
          schemaGuideText,
          esqlInput,
          naturalInput: text,
          haveESQLLine,
          doneESQL,
        });

        saveCacheWarmedInfo();
        setAllStats([...allStats, data.stats]);

        if (naturalInputRef.current?.value === text) {
          naturalInputRef.current?.setSelectionRange(0, naturalInput.length);
        }
      });
    },
    [
      performLLMAction,
      esqlInput,
      llmConfig,
      esqlGuideText,
      schemaGuideText,
      saveCacheWarmedInfo,
      allStats,
      history,
      naturalInput.length,
    ]
  );

  const handleCompleteESQL = async () => {
    await performLLMAction("ES|QL completion", async () => {
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
        apiKey: llmConfig.anthropic.apiKey,
        modelName: llmConfig.anthropic.modelName,
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
      await performLLMAction(
        "ES|QL field transform",
        async (adapter, addToSpan) => {
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

          const data = (await transformField(adapter, {
            type: "transformation",
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
      performLLMAction,
      llmConfig,

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
      if (!schema) {
        throw new Error(`No indices matching "${indexPattern}" found`);
      }
      setEsqlSchema(schema);
    });
  };

  useEffect(() => {
    let ignore = false;

    defaultESQLGuidePromise.then((response) => {
      if (!ignore) {
        setEsqlGuideText(response.data);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const handleProvideDemo = useCallback(
    async (item: DemoItem) => {
      const title = `${item.title  } demo`;

      await performQueryAPIAction(item.title, async (addToSpan) => {
        const missing = !(await checkIndexExists({
          apiURL: queryAPIURL,
          apiKey: queryAPIKey,
          index: item.index,
        }));

        if (missing) {
          let shouldRetry = false;

          const context: MissingDemoContext = {
            info: (explanation: string) =>
              toast({
                title,
                description: explanation,
                status: "info",
                duration: 3500,
                isClosable: true,
              }),
            prompt: (question: string) =>
              new Promise((resolve) => {
                const answer = window.confirm(question);
                resolve(answer);
              }),
            createIndex: async (params) => {
              await createIndex({
                apiURL: queryAPIURL,
                apiKey: queryAPIKey,
                index: item.index,
                params,
              });
              shouldRetry = true;
            },
          };

          await item.missingProvider(item, context);

          if (!shouldRetry) {
            return;
          }
        }

        let schema: ESQLSchema | null = null;
        try {
          schema = await deriveSchema({
            apiURL: queryAPIURL,
            apiKey: queryAPIKey,
            indexPattern: item.index,
          });
        } catch (error) {}

        if (!schema) {
          throw new Error("Failed to load the demo");
        }

        if (item.initialActions) {
          schema = {
            ...schema,
            initialActions: [...schema.initialActions, ...item.initialActions],
          };
        }

        setEsqlSchema(schema);
        toast({
          title,
          description: `Generated schema for the index ${item.index}`,
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      });
    },
    [queryAPIURL, queryAPIKey]
  );

  const handleChainAction = useCallback(
    (action: ESQLChainAction, knownFields: string[]): boolean => {
      try {
        const { chain } = performChainAction(visualChain, action, knownFields);
        setVisualChain(chain);
        return true;
      } catch (error) {
        return false;
      }
    },
    [visualChain]
  );

  const handleUnminimizeLimitBlock = useCallback(() => {
    if (minimizedLimitBlock) {
      setVisualChain([...visualChain, minimizedLimitBlock]);
      setMinimizedLimitBlock(undefined);
    }
  }, [visualChain, minimizedLimitBlock]);

  const updateVisualBlock = useCallback(
    (index: number, block: ESQLBlock) => {
      const blocks = [...visualChain];
      const blockWIthID: ESQLBlock & BlockHasStableId = {
        ...block,
        stableId: blocks[index].stableId,
      };
      blocks[index] = blockWIthID;
      setVisualChain(blocks);
    },
    [visualChain]
  );

  const handleVisualBlockAction = useCallback(
    (index: number, action: ComposerBlockAction) => {
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
    },
    [esqlInput, visualChain]
  );

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
                llmConfig={llmConfig}
                setLLMConfig={setLLMConfig}
                tooltipsShown={tooltipsShown}
                isAbleToTest={isLLMRequestAvailable}
                performTest={handlePerformLLMTest}
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
              isESQLRequestAvailable={isLLMESQLRequestAvailable}
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
              handleProvideDemo={handleProvideDemo}
            />
          </Section>

          <Section label="ES|QL Workbench">
            <VStack align={"stretch"} justify={"space-between"} spacing={4}>
              <ESQLWorkingArea
                tooltipsShown={tooltipsShown}
                isESQLRequestAvailable={isLLMESQLRequestAvailable}
                naturalInput={naturalInput}
                setNaturalInput={setNaturalInput}
                esqlInput={esqlInput}
                setEsqlInput={setEsqlInput}
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
