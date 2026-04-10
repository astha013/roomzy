function CompatibilityBar({ label, value }) {
  const getColor = (val) => {
    if (val >= 80) return '#16a34a';
    if (val >= 60) return '#22c55e';
    if (val >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ width: '80px', fontSize: '12px', color: '#6b7280' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: getColor(value), borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ width: '40px', fontSize: '12px', color: '#374151', textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default CompatibilityBar;