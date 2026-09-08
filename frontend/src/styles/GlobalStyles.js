import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  :root {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #e8f3ed;
    background: #07100c;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    background:
      radial-gradient(circle at 20% -10%, rgba(34,197,94,.10), transparent 32rem),
      radial-gradient(circle at 90% 20%, rgba(16,185,129,.08), transparent 26rem),
      #07100c;
  }

  button, input, select, textarea { font: inherit; }
  button { cursor: pointer; }
  a { color: inherit; text-decoration: none; }
`;
export default GlobalStyles;
