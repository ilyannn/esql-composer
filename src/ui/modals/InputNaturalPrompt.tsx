import {
  FormControl,
  HStack,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useRef } from "react";
import { GoCheck } from "react-icons/go";
import SpinningButton from "../components/SpinningButton";

interface InputNaturalPromptProps {
  children: React.ReactNode;
  inputLabel: string;
  onSubmit: (input: string) => void;
}

const InputNaturalPrompt = React.forwardRef<
  HTMLInputElement,
  InputNaturalPromptProps
>(({ children, inputLabel, onSubmit }, ref) => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (isOpen && firstFieldRef.current !== null) {
      onSubmit(firstFieldRef.current.value);
    }
    onClose();
  };

  return (
    <Popover
      isLazy
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      closeOnBlur={true}
      arrowSize={15}
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        p={1}
        color="white"
        bg="blue.300"
        borderColor="blue"
        minWidth={"30em"}
        style={{ fontVariantNumeric: "normal", letterSpacing: "normal" }}
      >
        <PopoverArrow bg="blue.300" />
        <PopoverCloseButton size={"md"} />
        <PopoverHeader pt={4} fontWeight="bold" border="0">
          {inputLabel}
        </PopoverHeader>
        <PopoverBody>
          <Stack spacing={1}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <FormControl>
                <HStack spacing={3} align={"center"} justify={"flex-start"}>
                  <Input ref={firstFieldRef} flex={1} />
                  <SpinningButton type={"submit"} spinningAction={handleSubmit}>
                    <GoCheck />
                  </SpinningButton>
                </HStack>
              </FormControl>
            </form>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
});

export default InputNaturalPrompt;
