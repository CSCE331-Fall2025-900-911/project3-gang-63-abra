import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import EmployeePanel from "./EmployeePanel.jsx";  // <-- correct name

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/employee" element={<EmployeePanel />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
