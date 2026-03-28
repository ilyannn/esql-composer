import React from "react";
import hljs from "../../../services/highlight-esql.js";

import "@highlightjs/cdn-assets/styles/nnfx-light.css";
import "./highlight-esql.css";

interface ESQLCodeBlockProps {
  value: string;
}

const ESQLCodeBlock: React.FC<ESQLCodeBlockProps> = ({ value }) => {
  const html = hljs.highlight(value, { language: "esql" }).value;

  return (
    <pre>
      <code
        className="language-esql hljs"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
};

export default React.memo(ESQLCodeBlock);
