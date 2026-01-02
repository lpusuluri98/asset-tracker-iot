import { useState } from "react";

const [assets, setAssets] = useState([]);
const [newAsset, setNewAsset] = useState({ UUID: '', name: '', location: ''});
const API_URL = "https://wfuicwwfs2.execute-api.us-east-2.amazonaws.com";

function AssetManager() {
    useEffect([], () => {
        fetch(API_URL + "/assets").then(response => response.json()).then(data => setAssets(data));
    }, []); 
    return (
        <h1>Asset Manager Page</h1>);
}
function handleAddAsset() {
    //fetch post api url for method post body json stringify input state if api returns ok manually add items to assets list
    fetch(API_URL + "/assets", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
    }).then(response => {assets.push(newAsset); setNewAsset({ UUID: '', name: '', location: ''});});
}