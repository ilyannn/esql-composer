import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Checkbox,
  HStack,
  Link,
  ListItem,
  Tooltip,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import React from "react";

import { COMPLETION_KEY } from "./constants";

interface HowToUseProps {
  tooltipsShown: boolean;
  setTooltipsShown: (value: boolean) => void;
}

const HowToUse: React.FC<HowToUseProps> = ({
  tooltipsShown,
  setTooltipsShown,
}) => {
  return (
    <HStack justify="space-between" align="stretch">
      <UnorderedList>
        <ListItem>
          Enter your Anthropic API key in the input field below.
        </ListItem>
        <ListItem>
          Add the ES|QL language and Elasticsearch schema reference materials.
        </ListItem>
        <ListItem>
          Input some natural text and press <kbd>Enter</kbd> to convert it to
          ES|QL.
        </ListItem>
        <ListItem>
          Press <kbd>{COMPLETION_KEY}</kbd> in the ES|QL area to show a
          completion (you can't insert it yet).
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
            Show Tooltips
          </Checkbox>
        </Tooltip>
        <Link href="https://github.com/ilyannn/esql-composer" isExternal>
          <ExternalLinkIcon mx="3px" /> source
        </Link>
      </VStack>
    </HStack>
  );
};

export default HowToUse;
