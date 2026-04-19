import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useStore } from "./lib/store";

// Initialize store/firebase
useStore.getState().initialize();

createRoot(document.getElementById("root")!).render(<App />);
