import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🔥 FIX: Activity undefined error
declare global {
  interface Window {
    Activity: any;
  }
}

if (!window.Activity) {
  window.Activity = {};
}

// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// render app
createRoot(document.getElementById("root")!).render(<App />);
