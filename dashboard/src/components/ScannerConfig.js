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
    <div className="mb-4">
      {/* Scanner Selection Card */}
      <div className="card shadow-sm mb-4" style={{
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, #8b5cf6dd 0%, #8b5cf6 100%)',
        color: '#ffffff'
      }}>
        <div className="card-body">
          <h6 className="card-subtitle mb-3" style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 10px 0'
          }}>
            📡 Select Scanner
          </h6>
          <select
            value={selectedScanner}
            onChange={(e) => setSelectedScanner(e.target.value)}
            className="form-select"
            style={{
              borderRadius: '8px',
              border: 'none',
              padding: '10px 12px',
              fontSize: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: '#1f2937'
            }}
          >
            {scanners.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Configuration Cards Grid */}
      <div className="row g-3">
        {/* Scanner Location Card */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100" style={{
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #f97316dd 0%, #f97316 100%)',
            color: '#ffffff'
          }}>
            <div className="card-body">
              <h5 className="card-title mb-2" style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: 0
              }}>
                📍 Scanner Location
              </h5>
              <p className="card-text mb-3" style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                Where is <strong>{selectedScanner}</strong> placed?
              </p>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Kitchen, Lobby..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  style={{
                    borderRadius: '8px 0 0 8px',
                    border: 'none',
                    padding: '10px 12px'
                  }}
                />
                <button
                  className="btn"
                  onClick={() => sendUpdate({ roomName: roomName })}
                  style={{
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#f97316',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Target Asset Card */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100" style={{
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #06b6d4dd 0%, #06b6d4 100%)',
            color: '#ffffff'
          }}>
            <div className="card-body">
              <h5 className="card-title mb-2" style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: 0
              }}>
                🎯 Target Asset
              </h5>
              <p className="card-text mb-3" style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                What should <strong>{selectedScanner}</strong> track?
              </p>
              <div className="input-group">
                <select
                  value={targetUUID}
                  onChange={(e) => setTargetUUID(e.target.value)}
                  className="form-select"
                  style={{
                    borderRadius: '8px 0 0 8px',
                    border: 'none',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#1f2937'
                  }}
                >
                  <option value="">-- Select Asset --</option>
                  {assets.map((asset) => (
                    <option key={asset.AssetUUID} value={asset.AssetUUID}>
                      {asset.FriendlyName}
                    </option>
                  ))}
                </select>
                <button
                  className="btn"
                  onClick={() => sendUpdate({ targetUUID: targetUUID })}
                  style={{
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#06b6d4',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScannerConfig;
