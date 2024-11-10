import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "@/components/theme-provider"

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
		
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<App />
		</ThemeProvider>
		</BrowserRouter>
	</React.StrictMode>
);
