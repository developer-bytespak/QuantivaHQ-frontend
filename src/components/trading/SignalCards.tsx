import React from 'react';

type Explanation = {
  text?: string | null;
};

type Asset = {
  asset_id: string;
  symbol?: string | null;
  name?: string | null;
  asset_type?: string | null;
};

type Signal = {
  signal_id: string;
  strategy_id?: string;
  asset: Asset;
  timestamp?: string | null;
  action?: 'BUY' | 'SELL' | 'HOLD' | string | null;
  confidence?: number | string | null;
  final_score?: number | null;
  explanations?: Explanation[];
  explanation?: { text?: string } | null; // legacy
  // Strategy parameters (from preview or execution)
  entry?: string | number | null;
  entry_price?: string | number | null;
  stop_loss?: string | number | null;
  take_profit?: string | number | null;
  stopLoss?: string | number | null;
  takeProfit?: string | number | null;
};

type Props = {
  signals: Signal[];
  className?: string;
};

function formatTimestamp(ts?: string | null) {
  if (!ts) return 'Unknown time';
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch (e) {
    return String(ts);
  }
}

function formatValue(val: any, defaultVal = '—') {
  if (val === null || val === undefined || val === '' || val === '—') return defaultVal;
  return String(val);
}

export const SignalCards: React.FC<Props> = ({ signals = [], className = '' }) => {
  // Ensure one card per asset (dedupe defensively)
  const map = new Map<string, Signal>();
  for (const s of signals) {
    const assetId = s.asset?.asset_id || (s as any).asset_id || '';
    if (!assetId) continue;
    // Prefer latest timestamp - assume incoming list may not be deduped
    const existing = map.get(assetId);
    if (!existing) {
      map.set(assetId, s);
    } else {
      const existingTs = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
      const newTs = s.timestamp ? new Date(s.timestamp).getTime() : 0;
      if (newTs > existingTs) map.set(assetId, s);
    }
  }

  const items = Array.from(map.values()).sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  if (items.length === 0) {
    return <div className={`signals-empty ${className}`}>No signals available</div>;
  }

  return (
    <div className={`signal-cards grid gap-4 ${className}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      {items.map((s) => {
        const asset = s.asset || ({} as Asset);
        const symbol = asset.symbol || asset.asset_id || 'Unknown';
        const name = asset.name || symbol;
        const action = s.action || 'HOLD';
        const confidence = s.confidence ?? '—';
        const explanationText = (s.explanations && s.explanations.length > 0)
          ? s.explanations[0].text
          : (s.explanation && s.explanation.text) || 'No explanation available';

        // Extract entry price, stop loss, and take profit
        const entryPrice = formatValue(s.entry_price || s.entry, '—');
        const stopLoss = formatValue(s.stop_loss || s.stopLoss, '—');
        const takeProfit = formatValue(s.take_profit || s.takeProfit, '—');

        return (
          <div key={s.signal_id} className="signal-card p-4 border rounded shadow-sm bg-white">
            {/* Header: Asset & Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                <div style={{ color: '#666', fontSize: 12 }}>{symbol}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: action === 'BUY' ? '#0b7315' : action === 'SELL' ? '#c9303e' : '#6c757d' }}>
                  {action}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>Confidence: {String(confidence)}</div>
              </div>
            </div>

            {/* Strategy Parameters */}
            <div style={{ marginBottom: 12, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#666', marginBottom: 2 }}>Entry Price</div>
                  <div style={{ fontWeight: 600 }}>{entryPrice}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: 2 }}>Stop Loss</div>
                  <div style={{ fontWeight: 600, color: '#c9303e' }}>— {stopLoss}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: 2 }}>Take Profit</div>
                  <div style={{ fontWeight: 600, color: '#0b7315' }}>— {takeProfit}</div>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ color: '#333', marginBottom: 8 }}>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{explanationText}</div>
            </div>

            {/* Timestamp */}
            <div style={{ fontSize: 11, color: '#888', borderTop: '1px solid #eee', paddingTop: 8 }}>
              {formatTimestamp(s.timestamp)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SignalCards;
