function StatCard({ title, value, color }) {
  const colorClass =
    {
      purple: "card-gradient-purple",
      orange: "card-gradient-orange",
      yellow: "card-gradient-yellow",
      cyan: "card-gradient-cyan",
      red: "card-gradient-red",
    }[color] || "card-gradient-purple";

  return (
    <div className={`card-base stat-card ${colorClass}`}>
      <h6 className="stat-card-title">{title}</h6>
      <p className="stat-card-value">{value}</p>
    </div>
  );
}
export default StatCard;
