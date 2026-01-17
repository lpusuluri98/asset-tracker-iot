import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{
        background: "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)",
        boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)",
        padding: "1rem 2rem",
        borderRadius: "0 0 20px 20px",
        marginBottom: "0",
      }}
    >
      <div className="container-fluid">
        <Link
          className="navbar-brand"
          to="/"
          style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span style={{ fontSize: "2rem" }}>🏠</span>
          Smart Tracker
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            borderColor: "rgba(255, 255, 255, 0.3)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-3">
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/"
                style={{
                  fontSize: "1rem",
                  fontWeight: location.pathname === "/" ? "700" : "500",
                  color:
                    location.pathname === "/"
                      ? "#fbbf24"
                      : "rgba(255, 255, 255, 0.85)",
                  paddingBottom: "6px",
                  borderBottom:
                    location.pathname === "/" ? "3px solid #fbbf24" : "none",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/") {
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/") {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                  }
                }}
              >
                📊 Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/assets"
                style={{
                  fontSize: "1rem",
                  fontWeight: location.pathname === "/assets" ? "700" : "500",
                  color:
                    location.pathname === "/assets"
                      ? "#fbbf24"
                      : "rgba(255, 255, 255, 0.85)",
                  paddingBottom: "6px",
                  borderBottom:
                    location.pathname === "/assets"
                      ? "3px solid #fbbf24"
                      : "none",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/assets") {
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/assets") {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                  }
                }}
              >
                📦 Assets
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
