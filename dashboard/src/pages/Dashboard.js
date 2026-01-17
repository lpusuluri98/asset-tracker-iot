import "../App.css";
import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import MotionSensor from "../components/MotionSensor";
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
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

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
    </div>
  );
}

export default Dashboard;
