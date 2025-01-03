import { type ESQLColumnTypeClass } from "../../models/esql/esql_types";
import { IconButton } from "@chakra-ui/react";

import {
  BsSortAlphaDown,
  BsSortAlphaUpAlt,
  BsSortNumericDown,
  BsSortNumericUpAlt,
  BsSortDownAlt,
  BsSortUp,
} from "react-icons/bs";

interface SortIconProps {
  variant: ESQLColumnTypeClass;
  ascending: boolean;
  onClick: () => void;
}

const SortIcon: React.FC<SortIconProps> = ({
  ascending,
  onClick,
  variant,
}: SortIconProps) => {
  const getIcon = () => {
    if (ascending) {
      switch (variant) {
        case "numeric":
          return <BsSortNumericDown size={22} />;
        case "stringy":
          return <BsSortAlphaDown size={22} />;
        default:
          return <BsSortDownAlt size={22} />;
      }
    } else {
      switch (variant) {
        case "numeric":
          return <BsSortNumericUpAlt size={22} />;
        case "stringy":
          return <BsSortAlphaUpAlt size={22} />;
        default:
          return <BsSortUp size={22} />;
      }
    }
  };

  return (
    <IconButton
      variant={"ghost"}
      color={"ihnerit"}
      aria-label={ascending ? "Sort Ascending" : "Sort Descending"}
      icon={getIcon()}
      onClick={onClick}
    />
  );
};

export default SortIcon;
