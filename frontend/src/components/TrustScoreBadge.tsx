function TrustScoreBadge({ score }) {
  const getColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (score) => {
    if (score >= 80) return 'Trusted';
    if (score >= 60) return 'Verified';
    if (score >= 40) return 'New';
    return 'Low';
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: `1px solid ${getColor(score)}`, borderRadius: '12px', background: 'white' }}>
      <span style={{ fontWeight: '700', fontSize: '12px', color: getColor(score) }}>{score}</span>
      <span style={{ fontSize: '10px', color: '#6b7280' }}>{getLabel(score)}</span>
    </div>
  );
}

export default TrustScoreBadge;