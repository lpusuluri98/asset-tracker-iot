import "../App.css";
import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import MotionSensor from "../components/MotionSensor";
import ScannerConfig from "../components/ScannerConfig";
import { API_URL } from "../config";

function Dashboard({ assets }) {
  const [roomStatus, setRoomStatus] = useState("No Motion");
  const [assetLocation, setAssetLocation] = useState("Searching...");
  async function fetchData() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log(data);
      if (data.motion === true) {
        setRoomStatus("Motion Detected");
      } else {
        setRoomStatus("No Motion");
      }
      setAssetLocation(data.room || "Unknown");
    } catch (err) {
      console.error("Error fetching data: ", err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>IoT Asset Tracker</h1>

      {/* 1. Dashboard View */}
      <div
        className="metrics"
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <StatCard
          title="Office Motion"
          value={roomStatus}
          color={roomStatus === "Motion Detected" ? "red" : "blue"}
        />
        {assets.map((asset) => (
          <StatCard
            title={`${asset.FriendlyName} Location`}
            key={asset.AssetUUID}
            value={assetLocation}
          />
          // {/* <button onClick={()=>{setRoomStatus(roomStatus === 'No Motion' ? 'Motion Detected' : 'No Motion')}}>Toggle Motion Status</button> */}
          // {/* <button onClick={()=>{setAssetLocation(assetLocation === "Searching..." ? "Located at (12.34, 56.78)" : "Searching...")}}>Toggle Asset Location</button> */}
          // {/* <MotionSensor /> */}
        ))}
      </div>
      {/* 2. The Control Panel (Imported Component) */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <ScannerConfig apiUrl={API_URL} assets={assets} />
      </div>
    </div>
  );
}

export default Dashboard;
