function StatCard({title,value,color}) {
    return (
        <div className="stat-card" style = {{border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '20px', 
      margin: '10px',
      backgroundColor: '#f9f9f9',
      width: '200px'}}>
            <h3 style={{margin: '0 0 10px 0', fontSize: '16px', color: '#555'}}>{title}</h3>
            <p style = {{margin: 0, fontSize: '24px', fontWeight:'bold', color: color || '#300'}}>{value}</p>
        </div>
    )
}
export default StatCard;