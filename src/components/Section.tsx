import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Heading,
  Spacer,
} from "@chakra-ui/react";
import React from "react";

interface SectionProps {
  label: string | undefined;
  color: string | undefined;
  headerElement: React.ReactNode | undefined;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  color,
  label,
  children,
  headerElement,
}) => {
  return (
    <AccordionItem backgroundColor={color}>
      <AccordionButton>
        <Heading as="h3" size="md">
          <AccordionIcon /> {label}
        </Heading>
        <Spacer />
        {headerElement}
      </AccordionButton>
      <AccordionPanel>{children}</AccordionPanel>
    </AccordionItem>
  );
};

export default Section;
