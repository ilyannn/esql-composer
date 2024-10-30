import React, { ReactNode } from 'react';
import { Button, Spinner } from '@chakra-ui/react';

interface SpinningButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

const SpinningButton: React.FC<SpinningButtonProps> = ({ isLoading, onClick, disabled, children }) => {
  return (
    <Button
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={disabled}
      spinner={<Spinner />}
      colorScheme="blue"
    >
      {children}
    </Button>
  );
};

export default SpinningButton;