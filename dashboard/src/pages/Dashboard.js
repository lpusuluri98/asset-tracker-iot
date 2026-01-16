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
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "2rem 1rem 0 1rem",
      }}
    >
      <h1
        className="mb-4"
        style={{ color: "#1f2937", fontWeight: "700", fontSize: "2.5rem" }}
      >
        Dashboard
      </h1>

      {/* 1. Dashboard View */}
      <div className="d-flex flex-wrap gap-3 justify-content-center mb-5">
        <StatCard
          title="Office Motion"
          value={roomStatus}
          color={roomStatus === "Motion Detected" ? "red" : "cyan"}
        />
        {assets.map((asset) => (
          <StatCard
            title={`${asset.FriendlyName} Location`}
            key={asset.AssetUUID}
            value={assetLocation}
            color={
              asset.FriendlyName === assets[0]?.FriendlyName
                ? "orange"
                : "yellow"
            }
          />
        ))}
      </div>

      {/* 2. The Control Panel (Imported Component) */}
      <div className="container-lg">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <ScannerConfig apiUrl={API_URL} assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
