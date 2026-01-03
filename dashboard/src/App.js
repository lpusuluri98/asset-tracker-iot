import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AssetManager from './pages/AssetManager';
import Navbar from './components/Navbar';

// import './App.css';
// import StatCard from './StatCard';
// import MotionSensor from './components/MotionSensor';
// import ScannerConfig from './ScannerConfig';

const API_URL = "https://wfuicwwfs2.execute-api.us-east-2.amazonaws.com";

function App() {
  const [roomStatus, setRoomStatus] = useState('No Motion');
  const [assetLocation, setAssetLocation] = useState("Searching...");
  async function fetchData() {
    try{
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log(data);
      if(data.motion == true){
        setRoomStatus("Motion Detected");
      }
      else{
        setRoomStatus("No Motion");
      }
      setAssetLocation(data.room || "Unknown");
    }
    catch(err){
      console.error("Error fetching data: ", err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<AssetManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
