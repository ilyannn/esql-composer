import { Icon, type IconProps } from "@chakra-ui/react";
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiX,
} from "react-icons/fi";

export const CheckIcon = (props: IconProps) => <Icon as={FiCheck} {...props} />;

export const ChevronDownIcon = (props: IconProps) => (
  <Icon as={FiChevronDown} {...props} />
);

export const ChevronUpIcon = (props: IconProps) => (
  <Icon as={FiChevronUp} {...props} />
);

export const CloseIcon = (props: IconProps) => <Icon as={FiX} {...props} />;

export const ExternalLinkIcon = (props: IconProps) => (
  <Icon as={FiExternalLink} {...props} />
);
