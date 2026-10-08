import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@/components/reusable/ThemeProvider";
import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/home.css";
import "./styles/product.css";
import "./styles/catalog.css";
import "./styles/cart.css";
import "./styles/checkout.css";
import "./styles/auth.css";
import "./styles/account.css";
import "./styles/not-found.css";
import "./styles/admin/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
