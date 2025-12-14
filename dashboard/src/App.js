import './App.css';
import { useState, useEffect } from 'react';
import StatCard from './StatCard';
import MotionSensor from './MotionSensor';
const API_URL = "https://wfuicwwfs2.execute-api.us-east-2.amazonaws.com";
function App() {
  const [roomStatus, setRoomStatus] = useState('No Motion');
  const [assetLocation, setAssetLocation] = useState("Searching...");
  async function fetchData() {
    try{
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log(data);
      if(data.motion == true){
        setRoomStatus("Motion Detected");
      }
      else{
        setRoomStatus("No Motion");
      }
      setAssetLocation(data.room);
    }
    catch(err){
      console.error("Error fetching data: ", err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="App">
      <h1>IoT Asset Tracker</h1>
      <div className="metrics" style={{display: 'flex'}}>
        <StatCard title="Office Motion" value={roomStatus} color = {roomStatus == "Motion Detected"? 'red':'blue'} />
        <StatCard title="Asset 1 Signal" value={assetLocation} />
        {/* <button onClick={()=>{setRoomStatus(roomStatus === 'No Motion' ? 'Motion Detected' : 'No Motion')}}>Toggle Motion Status</button> */}
        {/* <button onClick={()=>{setAssetLocation(assetLocation === "Searching..." ? "Located at (12.34, 56.78)" : "Searching...")}}>Toggle Asset Location</button> */}
        {/* <MotionSensor /> */}
      </div>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React 
        </a>
      </header> */}
    </div>
  );
}

export default App;
