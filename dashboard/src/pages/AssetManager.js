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
    <div style={{ padding: "20px" }}>
      <h1>Asset Manager Page</h1>
      {/*Input form*/}
      <div style={{ marginBottom: "20px" }}>
        <div className="input-group mb-3" style={{ maxWidth: "32%" }}>
          <span className="input-group-text">Asset UUID</span>
          <input
            placeholder="Asset UUID"
            value={uuidInput}
            className="form-control"
            onChange={(e) => setUuidInput(e.target.value)}
          />
        </div>
        <div className="input-group mb-3" style={{ maxWidth: "32%" }}>
          <span className="input-group-text">Friendly Name</span>
          <input
            placeholder="Name (e.g. Keys)"
            value={nameInput}
            className="form-control"
            onChange={(e) => setNameInput(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary" onClick={handleAddAsset}>
          Add Asset
        </button>
      </div>
      {/*List View of Assets*/}
      <ul className="list-group" style={{ maxWidth: "24%" }}>
        {assets.map((asset, index) => (
          <li key={index} className="card">
            <div className="card-header">{asset.FriendlyName}</div>
            <p className="card-body">
              <strong>Asset UUID:</strong> {asset.AssetUUID}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AssetManager;
