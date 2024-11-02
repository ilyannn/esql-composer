import ReactDOM from "react-dom/client";

import App from "./app/App";

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
