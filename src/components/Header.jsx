import React, { useState } from 'react';
import { Cpu, Settings, Activity, Sparkles, X } from 'lucide-react';

export default function Header({ apiKey, setApiKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');

  const handleSave = (e) => {
    e.preventDefault();
    setApiKey(tempKey);
    localStorage.setItem('cricvar_gemini_key', tempKey);
    setIsOpen(false);
  };

  return (
    <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'var(--neon-cyan)',
          color: 'var(--text-dark)',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: 'var(--glow-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Cpu size={24} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 10px rgba(0, 243, 255, 0.3)' }}>
            CRIC<span style={{ color: 'var(--neon-cyan)' }}>VAR</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} className="pulse" style={{ color: 'var(--neon-green)' }} />
            AI DECISION ENGINE v1.0 • ONLINE
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={12} style={{ color: apiKey ? 'var(--neon-green)' : 'var(--neon-yellow)' }} />
          <span>MODE: <strong style={{ color: apiKey ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>{apiKey ? 'LIVE AI (GEMINI)' : 'SIMULATION MODE'}</strong></span>
        </div>
        
        <button className="neon-btn" onClick={() => setIsOpen(true)}>
          <Settings size={16} />
          <span>CONFIG</span>
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--neon-cyan)' }}>
              SYSTEM CONFIGURATION
            </h2>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '20px' }}>
                <label className="label-title">GEMINI API KEY</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..." 
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                  Provide your Google Gemini API key to enable live video upload analysis. If empty, the system runs in high-fidelity mock Simulation Mode for preset cases.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="neon-btn neon-btn-red" onClick={() => setIsOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="neon-btn neon-btn-green">
                  SAVE SETTINGS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
