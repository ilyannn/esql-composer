import React, { ReactNode, forwardRef, useState, useCallback } from "react";
import { ScaleLoader } from "react-spinners";
import { Button } from "@chakra-ui/react";

interface SpinningButtonProps {
  spinningAction: () => Promise<void>;
  disabled?: boolean;
  children: ReactNode;
  type: "button" | "submit" | "reset" | undefined;
  targets?: "es" | "llm";
  size?: "sm" | "md" | "lg" | "xs";
  gratisAction?: boolean;
}

const SpinningButton = forwardRef<HTMLButtonElement, SpinningButtonProps>(
  (
    {
      spinningAction,
      disabled,
      children,
      targets = "llm",
      type,
      size = "md",
      gratisAction,
    },
    ref,
  ) => {
    const [isLoading, setIsLoading] = useState(false);

    const onClick = useCallback(async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          await spinningAction();
        } finally {
          setIsLoading(false);
        }
      }
    }, [isLoading, spinningAction]);

    const colorScheme = targets === "es" ? "teal" : "orange";
    const loaderColor = gratisAction === true ? colorScheme : "white";

    const loaderHeight = {
      xs: 15,
      sm: 20,
      md: 25,
      lg: 35,
    }[size];

    const loaderWidth = {
      xs: 1,
      sm: 2,
      md: 4,
      lg: 5,
    }[size];

    const loaderMargin = {
      xs: 1,
      sm: 2,
      md: 4,
      lg: 5,
    }[size];

    return (
      <Button
        ref={ref}
        type={type}
        onClick={onClick}
        isLoading={isLoading}
        size={size}
        isDisabled={disabled || false}
        spinner={
          <ScaleLoader
            height={loaderHeight}
            width={loaderWidth}
            margin={loaderMargin}
            color={loaderColor}
          />
        }
        colorScheme={targets === "es" ? "teal" : "orange"}
        variant={gratisAction === true ? "outline" : "solid"}
      >
        {children}
      </Button>
    );
  },
);

export default React.memo(SpinningButton);
