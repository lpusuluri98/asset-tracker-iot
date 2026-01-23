import { useState, useEffect } from "react";
import { API_URL } from "../config";

function AssetManager({ assets, setAssets }) {
  const [uuidInput, setUuidInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    fetch(API_URL + "/assets")
      .then((response) => response.json())
      .then((data) => {
        console.log("Loaded assets:", data);
        setAssets(data);
      })
      .catch((error) => console.error("Error fetching assets:", error));
  }, []);

  function handleAddAsset() {
    //fetch post api url for method post body json stringify input state if api returns ok manually add items to assets list
    const payload = { AssetUUID: uuidInput, FriendlyName: nameInput };
    fetch(API_URL + "/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          // setAssets(prevAssets =>
          //         prevAssets.some(item => item.AssetUUID === payload.AssetUUID)
          //             ? prevAssets.map((asset) => asset.AssetUUID === payload.AssetUUID ? payload : asset)
          //             : [...prevAssets, payload]
          //     );
          setAssets((prevAssets) => {
            const existingIndex = prevAssets.findIndex(
              (asset) => asset.AssetUUID === payload.AssetUUID
            );
            if (existingIndex >= 0) {
              const newList = [...prevAssets];
              newList[existingIndex] = payload;
              return newList;
            } else {
              return [...prevAssets, payload];
            }
          });
          setUuidInput("");
          setNameInput("");
        } else {
          alert("Failed to save");
        }
      })
      .catch((error) => console.error("Error adding asset:", error));
  }

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      {/* Page Header */}
      <div className="page-header-card">
        <h1>📦 Asset Manager</h1>
        <p>Add and manage your IoT assets</p>
      </div>

      <div className="row">
        {/* Add Asset Form Card */}
        <div className="col-lg-5 mb-4">
          <div
            className="card shadow-sm"
            style={{
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6dd 0%, #8b5cf6 100%)",
              color: "#ffffff",
            }}
          >
            <div className="card-body p-4">
              <h5
                className="card-title mb-4"
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  margin: 0,
                }}
              >
                ➕ Add New Asset
              </h5>

              <div className="mb-3">
                <label
                  className="form-label"
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255, 255, 255, 0.8)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Asset UUID
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter UUID"
                  value={uuidInput}
                  onChange={(e) => setUuidInput(e.target.value)}
                  style={{
                    borderRadius: "8px",
                    border: "none",
                    padding: "10px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    color: "#1f2937",
                  }}
                />
              </div>

              <div className="mb-4">
                <label
                  className="form-label"
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255, 255, 255, 0.8)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Friendly Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Wallet, Keys, Phone"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    borderRadius: "8px",
                    border: "none",
                    padding: "10px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    color: "#1f2937",
                  }}
                />
              </div>

              <button
                className="btn w-100"
                onClick={handleAddAsset}
                style={{
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  color: "#8b5cf6",
                  border: "none",
                  fontWeight: "700",
                  padding: "12px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="col-lg-7">
          <h6
            style={{
              color: "#1f2937",
              fontWeight: "700",
              fontSize: "16px",
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            📦 Your Assets
          </h6>

          <div style={{ display: "grid", gap: "12px" }}>
            {assets.length > 0 ? (
              assets.map((asset, index) => (
                <div
                  key={index}
                  className="card shadow-sm"
                  style={{
                    borderRadius: "12px",
                    border: "none",
                    background:
                      index % 3 === 0
                        ? "linear-gradient(135deg, #f97316dd 0%, #f97316 100%)"
                        : index % 3 === 1
                          ? "linear-gradient(135deg, #fbbf24dd 0%, #fbbf24 100%)"
                          : "linear-gradient(135deg, #06b6d4dd 0%, #06b6d4 100%)",
                    color: "#ffffff",
                  }}
                >
                  <div className="card-body d-flex justify-content-between align-items-center p-3">
                    <div>
                      <h6
                        className="card-title mb-1"
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          margin: 0,
                        }}
                      >
                        {asset.FriendlyName}
                      </h6>
                      <p
                        className="card-text mb-0"
                        style={{
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.8)",
                          fontFamily: "monospace",
                          wordBreak: "break-all",
                        }}
                      >
                        {asset.AssetUUID}
                      </p>
                    </div>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        color:
                          index % 3 === 0
                            ? "#f97316"
                            : index % 3 === 1
                              ? "#fbbf24"
                              : "#06b6d4",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Active
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="card shadow-sm"
                style={{
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #e5e7ebdd 0%, #e5e7eb 100%)",
                  color: "#6b7280",
                  padding: "3rem",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontWeight: "600" }}>
                  No assets yet. Add your first asset above!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetManager;
