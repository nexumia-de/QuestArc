import { render } from "solid-js/web";
// Load mocks only in development environment
if (import.meta.env && import.meta.env.DEV) {
  import("./mocks/plugin-api.mock");
}
import App from "./app/App";

// Mount the Solid.js app
const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
} else {
  console.error("Root element not found");
}
