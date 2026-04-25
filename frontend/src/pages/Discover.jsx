import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Layers } from 'lucide-react';

const NICHES = [
  'law firm', 'dentist', 'chiropractor', 'accountant', 'consultant',
  'boutique', 'restaurant', 'real estate agent', 'financial advisor',
  'plastic surgeon', 'med spa', 'gym', 'personal trainer', 'architect',
];

const CITIES = [
  'New York NY', 'Los Angeles CA', 'Chicago IL', 'Houston TX', 'Austin TX',
  'San Francisco CA', 'Miami FL', 'Seattle WA', 'Denver CO', 'Atlanta GA',
  'Boston MA', 'Nashville TN', 'Portland OR', 'Phoenix AZ', 'Las Vegas NV',
];

export default function Discover() {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [max, setMax] = useState(20);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [log]);

  const handleRun = async () => {
    if (!niche || !city) return;
    setRunning(true);
    setLog([{ type: 'info', msg: '⏳ Starting job...' }]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, city, max }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start job');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      console.log('Stream reader started');

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream reader finished (done: true)');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log(`Received chunk: ${chunk.length} chars`);
          
          buffer += chunk;
          const lines = buffer.split('\n');
          
          // Keep the last partial line in the buffer
          buffer = lines.pop();

          if (lines.length > 0) {
            setLog(prev => [
              ...prev,
              ...lines.map(line => ({
                type: line.startsWith('🚀') || line.startsWith('✅') ? 'info' : 
                      line.startsWith('⚠️') || line.startsWith('❌') ? 'error' : 'code',
                msg: line
              })).filter(l => l.msg.trim() !== '')
            ]);
          }
        } catch (readErr) {
          console.error('Error reading from stream:', readErr);
          setLog(prev => [...prev, { type: 'error', msg: `❌ Stream Error: ${readErr.message}` }]);
          break;
        }
      }


      if (buffer && buffer.trim() !== '') {
        setLog(prev => [...prev, { type: 'code', msg: buffer }]);
      }
    } catch (err) {
      setLog(prev => [...prev, { type: 'error', msg: `❌ ${err.message}` }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Discover Leads</div>
          <div className="page-subtitle">Scrape Google Maps for high-value prospects</div>
        </div>
      </div>

      <div className="page-body">
        <div className="discover-card">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>New Discovery Job</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Configure your search and run the scraper locally. Results sync to your dashboard automatically.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Layers size={11} style={{ display: 'inline', marginRight: 4 }} />
                Niche
              </label>
              <input
                className="input"
                placeholder="e.g. law firm, dentist..."
                value={niche}
                onChange={e => setNiche(e.target.value)}
                list="niche-list"
              />
              <datalist id="niche-list">
                {NICHES.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                City
              </label>
              <input
                className="input"
                placeholder="e.g. Austin TX"
                value={city}
                onChange={e => setCity(e.target.value)}
                list="city-list"
              />
              <datalist id="city-list">
                {CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Max leads to scrape</label>
              <select className="input" value={max} onChange={e => setMax(Number(e.target.value))}>
                {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} leads</option>)}
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={!niche || !city || running}
          >
            {running ? <span className="spinner" style={{ width: 14, height: 14, marginRight: 8 }}></span> : <Search size={14} />}
            {running ? 'Running Scraper...' : 'Start Discovery'}
          </button>

          {log.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="section-label">Live Logs</div>
              <div 
                ref={logEndRef}
                style={{ 
                  marginTop: 10,
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 4,
                  maxHeight: 420,
                  overflowY: 'auto',
                  background: '#0a0a0f',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                }}
              >
                {log.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      color: entry.type === 'info' ? 'var(--text-primary)' : 
                             entry.type === 'error' ? '#ff5252' : '#a5d6a7',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5
                    }}
                  >
                    {entry.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div style={{ marginTop: 24 }}>

          <div className="section-label">Tips for best results</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[
              '🔥 Target niches where clients pay premium prices — law, medical, financial',
              '📍 Start with 1 city + 1 niche at a time, then expand',
              '⭐ Leads scoring 60+ should get emails within 24 hours',
              '🚫 Avoid niches with very low web budgets (e.g. food trucks)',
            ].map((tip, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

