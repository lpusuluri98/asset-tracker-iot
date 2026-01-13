import React, { useState, useEffect } from "react";

function ScannerConfig({ apiUrl, assets }) {
  const [scanners, setScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState("");
  const [targetUUID, setTargetUUID] = useState("");
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    async function fetchScanners() {
      try {
        const response = await fetch(`${apiUrl}/scanners`);
        const data = await response.json();
        console.log("Fetched scanners: ", data);
        setScanners(data);

        if (data.length > 0) {
          setSelectedScanner(data[0]);
        }
      } catch (err) {
        console.error("Error fetching scanners: ", err);
      }
    }
    fetchScanners();
  }, [apiUrl]);

  async function sendUpdate(payload) {
    if (!selectedScanner) {
      alert("No scanner selected");
      return;
    }
    const finalBody = {
      scannerID: selectedScanner,
      ...payload,
    };
    try {
      const response = await fetch(`${apiUrl}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalBody),
      });
      if (response.ok) {
        alert(`Success! Updated ${selectedScanner}`);
        setTargetUUID("");
        setRoomName("");
      } else {
        alert("Failed to update configuration");
      }
    } catch (err) {
      console.error("Error updating config: ", err);
      alert("Error updating configuration");
    }
  }
  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      {/* 🟢 SECTION 1: SELECT DEVICE */}
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <label>
          <strong>Select Scanner to Manage:</strong>
        </label>
        <select
          value={selectedScanner}
          onChange={(e) => setSelectedScanner(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            fontSize: "16px",
          }}
        >
          {scanners.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* 🔵 SECTION 2: INFRASTRUCTURE (Room Name) */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>📍 Scanner Location</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Where is <strong>{selectedScanner}</strong> placed?
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="e.g. Kitchen, Lobby..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              style={inputStyle}
            />
            <button
              // 🧠 LOGIC: This button sends ONLY roomName
              onClick={() => sendUpdate({ roomName: roomName })}
              style={btnStyle}
            >
              Update Location
            </button>
          </div>
        </div>

        {/* 🟣 SECTION 3: ASSET TRACKING (Target UUID) */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>🎯 Target Asset</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>
            What UUID should <strong>{selectedScanner}</strong> look for?
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            {/* <input
              type="text"
              placeholder="e.g. Bag, Keys, Phone..."
              value={targetUUID}
              onChange={(e) => setTargetUUID(e.target.value)}
              style={inputStyle}
            /> */}
            <select
              value={targetUUID}
              onChange={(e) => setTargetUUID(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Select Asset UUID --</option>
              {assets.map((asset) => (
                <option key={asset.AssetUUID} value={asset.AssetUUID}>
                  {asset.FriendlyName}
                </option>
              ))}
            </select>
            <button
              // 🧠 LOGIC: This button sends ONLY targetUUID
              onClick={() => sendUpdate({ targetUUID: targetUUID })}
              style={btnStyle}
            >
              Update Target
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "15px",
  backgroundColor: "#f9f9f9",
  textAlign: "left",
};

const inputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ddd",
};

const btnStyle = {
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};
export default ScannerConfig;
