import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import AssetManager from "./pages/AssetManager";
import ScannerManagement from "./pages/ScannerManagement";
import Navbar from "./components/Navbar";
import { API_URL } from "./config";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/global.css";

function App() {
  const [assets, setAssets] = useState([]);
  useEffect(() => {
    fetch(API_URL + "/assets")
      .then((response) => response.json())
      .then((data) => setAssets(data))
      .catch((error) => console.error("Error fetching assets:", error));
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard assets={assets} />} />
        <Route
          path="/assets"
          element={<AssetManager assets={assets} setAssets={setAssets} />}
        />
        <Route
          path="/scanner"
          element={<ScannerManagement apiUrl={API_URL} assets={assets} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
