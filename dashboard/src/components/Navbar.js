import { Link } from "react-router-dom";
function Navbar() {
    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
        }} className="navbar navbar-expand-lg bg-body-tertiary bg-light">
            <h1>IoT Asset Tracker</h1>
            <div>
                <Link className="navbar-brand" to="/">Dashboard</Link>
                <Link className ="navbar-brand" to="/assets">Assets</Link>
            </div>
        </nav>
    );
}
export default Navbar;