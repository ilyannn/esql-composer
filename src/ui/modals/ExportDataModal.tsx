import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Text,
  VStack,
  Input,
  InputRightAddon,
  InputGroup,
  FormLabel,
  HStack,
  Link,
  Spacer,
  Checkbox,
} from "@chakra-ui/react";
import SpinningButton from "../components/SpinningButton";
import React, { useCallback, useState } from "react";
import {
  ExportFormat,
  ExportFormatOptions,
  KNOWN_EXPORT_FORMATS,
} from "@/services/es/formats";
import LimitSlider from "../components/LimitSlider";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Form } from "react-aria-components";

export interface ExportDataCallback {
  (
    filename: string,
    formatOptions: ExportFormatOptions,
    limit: number | null,
  ): Promise<boolean>;
}

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLimitSettings: () => Promise<void>;
  onExport: ExportDataCallback;
}

const LIMIT_VALUES = [100, 1000, 10000] as const;

const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  onShowLimitSettings,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    KNOWN_EXPORT_FORMATS[0],
  );

  const [limit, setLimit] = useState<number | null>(1000);
  const [isColumnar, setIsColumnar] = useState(false);
  const [addPreamble, setAddPreamble] = useState(false);
  const [basename, setBasename] = useState("esql-export");

  const handleExport = useCallback(async () => {
    const filename = `${basename}${selectedFormat.fileExt}`;
    const formatOptions = {
      format: selectedFormat,
      columnar: selectedFormat.canBeColumnar && isColumnar,
      addPreamble: selectedFormat.canAddPreamble && addPreamble,
    };
    if (await onExport(filename, formatOptions, limit)) {
      onClose();
    }
  }, [basename, limit, onExport, onClose, selectedFormat, isColumnar]);

  const setSelectedFormatID = useCallback((id: string) => {
    setSelectedFormat(KNOWN_EXPORT_FORMATS.find((format) => format.id === id)!);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <Form>
          <ModalHeader>Export Query Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={7} align="stretch" justify={"stretch"}>
              <VStack spacing={0} align="stretch" justify={"stretch"}>
                <HStack align="baseline" justify={"space-between"}>
                  <FormLabel>Limit:</FormLabel>
                  <Spacer />
                  <Link
                    size={"sm"}
                    isExternal
                    href="https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-limitations.html#esql-max-rows"
                  >
                    <ExternalLinkIcon /> Documentation
                  </Link>
                </HStack>
                <LimitSlider
                  limit={limit}
                  onChange={(limit) => setLimit(limit)}
                  onShowLimitSettings={onShowLimitSettings}
                  sliderValues={LIMIT_VALUES}
                />
              </VStack>
              <VStack spacing={0} align="stretch" justify={"stretch"}>
                <HStack align="baseline" justify={"space-between"}>
                  <FormLabel>Format:</FormLabel>
                  <Spacer />
                  <Link
                    size={"sm"}
                    isExternal
                    href="https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-rest.html#esql-rest-format"
                  >
                    <ExternalLinkIcon /> Documentation
                  </Link>
                </HStack>
                <RadioGroup
                  value={selectedFormat.id}
                  onChange={setSelectedFormatID}
                >
                  <VStack align="stretch" justify={"stretch"} spacing={2}>
                    {KNOWN_EXPORT_FORMATS.map((format) => (
                      <Radio key={format.id} value={format.id}>
                        <HStack spacing={7} justify={"stretch"}>
                          <Text>{format.description}</Text>
                          {selectedFormat.id === format.id &&
                            selectedFormat.canBeColumnar && (
                              <Checkbox
                                isChecked={isColumnar}
                                onChange={() => setIsColumnar(!isColumnar)}
                              >
                                Columnar
                              </Checkbox>
                            )}
                          {selectedFormat.id === format.id &&
                            selectedFormat.canAddPreamble && (
                              <Checkbox
                                isChecked={addPreamble}
                                onChange={() => setAddPreamble(!addPreamble)}
                              >
                                Preamble
                              </Checkbox>
                            )}
                        </HStack>
                      </Radio>
                    ))}
                  </VStack>
                </RadioGroup>
              </VStack>

              <HStack spacing={2} align="baseline" justify={"space-between"}>
                <FormLabel flexShrink={0}>File name:</FormLabel>
                <InputGroup flex={1}>
                  <Input
                    variant="outline"
                    value={basename}
                    onChange={(e) => setBasename(e.target.value)}
                  />
                  <InputRightAddon>{selectedFormat.fileExt}</InputRightAddon>
                </InputGroup>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <SpinningButton
              targets="es"
              type="submit"
              spinningAction={handleExport}
            >
              Export
            </SpinningButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default React.memo(ExportDataModal);
