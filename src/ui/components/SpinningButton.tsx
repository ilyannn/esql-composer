import React, { ReactNode, forwardRef, useState, useCallback } from "react";
import { PacmanLoader, ScaleLoader } from "react-spinners";
import { Button } from "@chakra-ui/react";

interface SpinningButtonProps {
  spinningAction: () => Promise<void>;
  disabled?: boolean;
  children: ReactNode;
  type: "button" | "submit" | "reset" | undefined;
  targets?: "es" | "llm";
  size?: "sm" | "md" | "lg";
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
    ref
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

    return (
      <Button
        ref={ref}
        type={type}
        onClick={onClick}
        isLoading={isLoading}
        size={size}
        isDisabled={disabled || false}
        spinner={
          gratisAction === true ? (
            <PacmanLoader size={15} color="blue" speedMultiplier={2} />
          ) : (
            <ScaleLoader height={25} margin={4} color="white" />
          )
        }
        colorScheme={targets === "es" ? "teal" : "orange"}
        variant={gratisAction === true ? "outline" : "solid"}
      >
        {children}
      </Button>
    );
  }
);

export default React.memo(SpinningButton);
