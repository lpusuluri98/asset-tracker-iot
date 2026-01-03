import { useState, useEffect } from "react";

const API_URL = "https://wfuicwwfs2.execute-api.us-east-2.amazonaws.com";

function AssetManager() {
    const [assets, setAssets] = useState([]);
    const [uuidInput, setUuidInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    
    useEffect(() => {
        fetch(API_URL + "/assets")
            .then(response => response.json())
            .then(data => {
                console.log("Loaded assets:", data);
                setAssets(data)})
                .catch(error => console.error("Error fetching assets:", error));
    }, []);
    
    function handleAddAsset() {
        //fetch post api url for method post body json stringify input state if api returns ok manually add items to assets list
        const payload = { AssetUUID: uuidInput, FriendlyName: nameInput };
        fetch(API_URL + "/assets", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if(response.ok){
                setAssets([...assets, payload]); 
                setUuidInput(''); 
                setNameInput('');}
            else {
                alert("Failed to save");
            }
        }).catch(error => console.error("Error adding asset:", error));
    }

    return (
        <div style = {{ padding: '20px' }}>
            <h1>Asset Manager Page</h1>
            {/*Input form*/}
            <div style = {{ marginBottom: '20px' }}>
                <input
                    placeholder = "Asset UUID"
                    value = {uuidInput}
                    onChange={(e) => setUuidInput(e.target.value)}
                />
                <input
                    placeholder="Name (e.g. Keys)"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                />
                <button onClick={handleAddAsset}>Add Asset</button>
            </div>
            {/*List View of Assets*/}
            <ul>
                {assets.map((asset, index) => (
                    <li key={index}>
                        <strong>{asset.FriendlyName}</strong> ({asset.AssetUUID})
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AssetManager;