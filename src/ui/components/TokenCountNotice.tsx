import React from 'react';
import { Text } from '@chakra-ui/react';

interface TokenCountNoticeProps {
  charCount: number | null;
  tokenCount: number | null;
}

const TokenCountNotice: React.FC<TokenCountNoticeProps> = ({ tokenCount, charCount }) => {
  let text = "";
  
  if (tokenCount !== null) {
    const tokenText = tokenCount === 1 ? 'token' : 'tokens';
    text = `${tokenCount} ${tokenText}`;
  } else if (charCount !== null && charCount > 0) {
    const charText = tokenCount === 1 ? 'character' : 'characters';
    text = `${charCount} ${charText}`;
  }

  return <Text fontSize="sm" fontWeight={"light"}>{text}</Text>;
};

export default TokenCountNotice;