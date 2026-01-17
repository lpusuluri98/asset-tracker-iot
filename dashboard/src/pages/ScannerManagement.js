import "../App.css";
import ScannerConfig from "../components/ScannerConfig";

function ScannerManagement({ apiUrl, assets }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Scanner Management</h1>
      </div>

      <div className="container-lg">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <ScannerConfig apiUrl={apiUrl} assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScannerManagement;
