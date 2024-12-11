import {
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useState } from "react";
import SpinningButton from "../components/SpinningButton";
interface GetSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  getSchemaFromES: (
    indexPattern: string,
    randomSamplingFactor: number
  ) => Promise<void>;
}

const HUMAN_READABLE_FACTOR = ["all", "10%", "1%", ".1%", ".01%"];

const GetSchemaModal: React.FC<GetSchemaModalProps> = ({
  getSchemaFromES,
  isOpen,
  onClose,
}) => {
  const [indexPattern, setIndexPattern] = useState<string>("");
  const [systemIndicesHidden, setSystemIndicesHidden] = useState<boolean>(true);
  const [randomSamplingExponent, setRandomSamplingExponent] =
    useState<number>(0);

  const randomSamplingFactor = 10 ** randomSamplingExponent;
  const samplingHelperText =
    randomSamplingExponent === 0 ? (
      <Text>All of the documents will be used when computing top values.</Text>
    ) : (
      <Text>
        Only each {randomSamplingFactor}th document will be used for computing
        top values. Requires{" "}
        <Link
          isExternal
          href="https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-random-sampler-aggregation.html"
        >
          <ExternalLinkIcon /> random sampler aggregation
        </Link>{" "}
        support.{" "}
      </Text>
    );

  const handleSubmit = async () => {
    const userPattern = indexPattern.trim() || "*";
    const patternMayContainSystemIndices = userPattern
      .split(",")
      .some((p) => p.startsWith("*") || p.startsWith("."));
    const systemPattern =
      systemIndicesHidden && patternMayContainSystemIndices ? "-.*" : "";
    const patterns = [userPattern, systemPattern].filter((p) => p.length > 0);
    await getSchemaFromES(patterns.join(","), randomSamplingFactor);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Generate schema</ModalHeader>
        <ModalCloseButton />
        <form>
          <ModalBody>
            <Stack spacing={3}>
              <Text>
                This will provide a schema description based on the data in your
                Elasticsearch instance.
              </Text>
              <FormControl>
                <FormLabel>Index selection</FormLabel>
                <Input
                  autoFocus={true}
                  placeholder="Pattern for index, alias or datastream names"
                  value={indexPattern}
                  onChange={(e) => setIndexPattern(e.target.value)}
                />
                <VStack align="stretch" spacing={3}>
                  <FormHelperText>
                    It is recommended to select indices with similar fields.
                  </FormHelperText>
                  <Checkbox
                    isChecked={systemIndicesHidden}
                    onChange={() =>
                      setSystemIndicesHidden(!systemIndicesHidden)
                    }
                  >
                    Skip system indices
                  </Checkbox>
                </VStack>
              </FormControl>
              <FormControl>
                <FormLabel>Downsampling</FormLabel>
                <Box mt="14px" mr="20px" mb="15px">
                  <Slider
                    max={4}
                    focusThumbOnChange={false}
                    value={randomSamplingExponent}
                    onChange={setRandomSamplingExponent}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb
                      border="2px"
                      borderColor="green.200"
                      fontSize="xs"
                      boxSize="38px"
                      children={
                        <Text>
                          {HUMAN_READABLE_FACTOR[randomSamplingExponent]}
                        </Text>
                      }
                    />
                  </Slider>
                </Box>
                <FormHelperText height="2em">
                  {samplingHelperText}
                </FormHelperText>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <SpinningButton
              targets="es"
              type="submit"
              spinningAction={handleSubmit}
            >
              Generate
            </SpinningButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default GetSchemaModal;
