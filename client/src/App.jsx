import { Navigate, Route, Routes } from "react-router-dom";
import MainTemplate from "./components/MainTemplate";

import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ModelsPage from "./pages/ModelsPage";
import GenerationsPage from "./pages/GenerationsPage";
import ToolsPage from "./pages/ToolsPage";
import SettingsPage from "./pages/SettingsPage";


export default function App() {
  return (
    <MainTemplate>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/generations" element={<GenerationsPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MainTemplate>
  );
}