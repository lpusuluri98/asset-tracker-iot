function StatCard({ title, value, color }) {
  const colorMap = {
    purple: "#8b5cf6",
    orange: "#f97316",
    yellow: "#fbbf24",
    cyan: "#06b6d4",
    red: "#ef4444",
  };

  const bgColor = colorMap[color] || colorMap["purple"];

  return (
    <div
      className="card shadow-sm"
      style={{
        borderRadius: "16px",
        border: "none",
        width: "280px",
        background: `linear-gradient(135deg, ${bgColor}dd 0%, ${bgColor} 100%)`,
        color: "#ffffff",
        padding: "24px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="card-body p-0">
        <h6
          className="card-subtitle mb-2"
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "11px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </h6>
        <p
          className="card-text mb-0"
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#ffffff",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
export default StatCard;
