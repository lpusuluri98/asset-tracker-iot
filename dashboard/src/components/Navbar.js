import { Link } from "react-router-dom";
function Navbar() {
    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
        }}>
            <h1>IoT Asset Tracker</h1>
            <div>
                <Link to="/">Dashboard</Link>
                <Link to="/assets">Assets</Link>
            </div>
        </nav>
    );
}
export default Navbar;