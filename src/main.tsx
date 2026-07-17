import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/context";
import { useUIStore } from "@/stores/uiStore";

function Root() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);

  return (
    <I18nProvider language={language} setLanguage={setLanguage}>
      <Toaster position="bottom-right" richColors />
      <App />
    </I18nProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
