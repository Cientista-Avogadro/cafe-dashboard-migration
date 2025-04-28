import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import RemixIcon
const remixIconLink = document.createElement("link");
remixIconLink.rel = "stylesheet";
remixIconLink.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
document.head.appendChild(remixIconLink);

// Import Google Fonts (Inter & Roboto)
const googleFontsLink = document.createElement("link");
googleFontsLink.rel = "stylesheet";
googleFontsLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@400;500;700&display=swap";
document.head.appendChild(googleFontsLink);

// Set page title
const titleElement = document.createElement("title");
titleElement.textContent = "AgroGestão - Sistema de Gerenciamento Agrícola";
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
