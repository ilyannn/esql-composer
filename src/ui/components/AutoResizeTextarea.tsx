// https://github.com/chakra-ui/chakra-ui/issues/670#issuecomment-969444392
import { Textarea, TextareaProps } from "@chakra-ui/react";
import React from "react";
import ResizeTextarea from "react-textarea-autosize";

export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>((props, ref) => {
  return (
    <Textarea
      minH="unset"
      overflow="hidden"
      w="100%"
      resize="none"
      ref={ref}
      minRows={3}
      as={ResizeTextarea}
      {...props}
    />
  );
});
