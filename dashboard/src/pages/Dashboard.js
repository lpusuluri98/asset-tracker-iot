import "../App.css";
import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import MotionSensor from "../components/MotionSensor";
import { API_URL } from "../config";

function Dashboard({ assets }) {
  const [rooms, setRooms] = useState([]);
  const [assetLocations, setAssetLocations] = useState([]);
  async function fetchData() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log(data);
      console.log("Fetched dashboard assets: ", assets);
      const parsedData =
        typeof data.body === "string" ? JSON.parse(data.body) : data;
      setRooms(parsedData.rooms || []);
      setAssetLocations(parsedData.assetLocations || []);
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
    <div className="content-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>

        {/* 1. Dashboard View */}
        <div className="section-card card-base flex-wrap gap-3 justify-content-center mb-5">
          <h3 className="mb-4">Room Status</h3>
          <div className="d-flex flex-wrap gap-3 justify-content-center mb-5">
            {rooms.map((room) => (
              <StatCard
                title={room.RoomID}
                key={room.RoomID}
                value={room.MotionDetected ? "Motion Detected" : "No Motion"}
                color={room.MotionDetected ? "red" : "cyan"}
              />
            ))}
          </div>
        </div>
        <div className="section-card card-base flex-wrap gap-3 justify-content-center mb-5">
          <h3 className="mb-4">Motion Sensors</h3>
          <div className="d-flex flex-wrap gap-3 justify-content-center mb-5">
            {assets.map((asset, index) => {
              const assetLocation = assetLocations.find(
                (loc) => loc.AssetID === asset.AssetUUID,
              );
              return (
                <StatCard
                  title={`${asset.FriendlyName} Location`}
                  key={asset.AssetID}
                  value={
                    assetLocation ? assetLocation.Location : "Searching..."
                  }
                  color={index === 0 ? "orange" : "yellow"}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
