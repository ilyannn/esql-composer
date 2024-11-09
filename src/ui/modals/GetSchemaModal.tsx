import {
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalContent,
  FormControl,
  Stack,
  Input,
  Text,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
} from "@chakra-ui/react";

import { useState } from "react";
import SpinningButton from "../components/SpinningButton";

interface GetSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GetSchemaModal: React.FC<GetSchemaModalProps> = ({ isOpen, onClose }) => {
  const [indexPattern, setIndexPattern] = useState<string>("");
  const [maxDocs, setMaxDocs] = useState<number>(10);

  const handleSubmit = async () => {
    console.log("Get Schema");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Derive schema description</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text>
              This will retrieve the index information as well as sample
              documents from Elasticsearch and fuse it into schema description.
            </Text>
            <FormControl>
              <FormLabel>Restrict to indices</FormLabel>
              <Input
                isRequired={true}
                placeholder="Index pattern"
                value={indexPattern}
                onChange={(e) => setIndexPattern(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Max number of documents</FormLabel>
              <Flex >
                <NumberInput
                  min={0}
                  allowMouseWheel
                  maxW="100px"
                  mr="2rem"
                  value={maxDocs}
                  onChange={(valueString) =>
                    setMaxDocs(parseInt(valueString, 10))
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Slider
                  flex="1"
                  focusThumbOnChange={false}
                  value={maxDocs}
                  onChange={setMaxDocs}
                  mr={"20px"}
                  ml={"10px"}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb
                    fontSize="sm"
                    boxSize="32px"
                    children={maxDocs}
                  />
                </Slider>
              </Flex>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <SpinningButton
            targets="es"
            type="submit"
            spinningAction={handleSubmit}
          >
            Derive
          </SpinningButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GetSchemaModal;
