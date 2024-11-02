import React, { ReactNode, forwardRef, useState, useCallback } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { Button } from "@chakra-ui/react";

interface SpinningButtonProps {
  spinningAction: () => Promise<void>;
  disabled?: boolean;
  children: ReactNode;
  type: "button" | "submit" | "reset" | undefined;
}

const SpinningButton = forwardRef<HTMLButtonElement, SpinningButtonProps>(
  ({ spinningAction, disabled, children, type }, ref) => {
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
        isDisabled={disabled}
        spinner={<ScaleLoader height={25} margin={4} color="white" />}
        colorScheme="blue"
      >
        {children}
      </Button>
    );
  }
);

export default React.memo(SpinningButton);
