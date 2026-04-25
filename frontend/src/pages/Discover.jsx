import { useState } from 'react';
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

  const handleRun = () => {
    if (!niche || !city) return;
    setRunning(true);
    setLog([]);

    // The scraper runs locally. This page shows the command to run.
    setLog([
      { type: 'info', msg: '📋 Copy and run this command in your terminal:' },
      { type: 'code', msg: `cd backend && node scraper/run.js --niche "${niche}" --city "${city}" --max ${max}` },
      { type: 'info', msg: '✅ Leads will appear in the Dashboard automatically as they are saved to Supabase.' },
      { type: 'info', msg: '⏱  Expected time: ~2–5 minutes for 20 leads (includes audit + email discovery).' },
    ]);
    setRunning(false);
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
            <Search size={14} />
            {running ? 'Generating...' : 'Generate Command'}
          </button>

          {log.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="section-label">Run this locally</div>
              {log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    background: entry.type === 'code' ? '#0a0a0f' : 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 14px',
                    fontSize: entry.type === 'code' ? 13 : 13,
                    fontFamily: entry.type === 'code' ? "'JetBrains Mono', monospace" : 'inherit',
                    color: entry.type === 'code' ? '#a5d6a7' : 'var(--text-secondary)',
                    userSelect: entry.type === 'code' ? 'all' : 'auto',
                  }}
                >
                  {entry.msg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div style={{ marginTop: 24, maxWidth: 560 }}>
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
