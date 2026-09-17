import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Home from "@/app/page";
import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
    <Toaster richColors position="top-center" />
  </StrictMode>,
);
