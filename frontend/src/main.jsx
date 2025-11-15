import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/toast";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
		
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<ToastProvider>
				<App />
			</ToastProvider>
		</ThemeProvider>
		</BrowserRouter>
	</React.StrictMode>
);
