import { useState } from 'react';

function MotionSensor() {
  const [isMotion, setMotion] = useState(false);
  function toggleSensor() {
    setMotion(!isMotion);
    }
    return (
        <div>   
            <h2>Sensor Status: {isMotion ? "Motion Detected!": "Clear"}</h2>
            <button onClick={toggleSensor}>Simulate Motion</button>
        </div>);
}
export default MotionSensor;