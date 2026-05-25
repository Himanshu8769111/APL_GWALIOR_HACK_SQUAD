import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Cpu, AlertCircle, FileText } from 'lucide-react';
import { presets } from '../data/presets';

export default function UmpireAnalysis({
  presetsList,
  activePreset,
  setActivePreset,
  analysisState,
  setAnalysisState,
  isScanning,
  setIsScanning,
  setCurrentFrame,
  setIsPlaying,
  calibrationX
}) {
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const statusUpdates = [
    { threshold: 0, text: "Accessing camera feed frame buffers..." },
    { threshold: 20, text: "Calibrating pitch popping crease boundary..." },
    { threshold: 45, text: "Detecting batsman body and bat landmarks..." },
    { threshold: 70, text: "Calculating ball collision coordinates..." },
    { threshold: 90, text: "Verifying audio sound wave frequency spikes..." },
    { threshold: 100, text: "Finalizing ruling verdict..." }
  ];

  const handleStartAnalysis = () => {
    setIsPlaying(false);
    setIsScanning(true);
    setAnalysisState('scanning');
    setProgress(0);
    setStatusMsg("Initializing AI analysis cores...");
  };

  useEffect(() => {
    let timer = null;
    if (isScanning) {
      timer = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 5;
          
          // Update status message based on progress
          const currentStatus = statusUpdates.reduce((acc, current) => {
            if (next >= current.threshold) return current.text;
            return acc;
          }, "Processing...");
          setStatusMsg(currentStatus);

          if (next >= 100) {
            clearInterval(timer);
            setIsScanning(false);
            setAnalysisState('complete');
            
            // Set the video scrubber to the decisive bailOffFrame or soundSpikeFrame
            const decisiveFrame = activePreset.bailOffFrame > 0 
              ? activePreset.bailOffFrame 
              : activePreset.soundSpikeFrame;
            if (decisiveFrame > 0) {
              setCurrentFrame(decisiveFrame);
            }
            return 100;
          }
          return next;
        });
      }, 150); // total 3 seconds
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isScanning, activePreset]);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-cyan)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
        INCIDENT CONTROL PANEL
      </h3>

      {/* Preset Match / Appeal Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-title">SELECT ACTIVE APPEAL CASE</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {presetsList.map((preset) => (
            <button
              key={preset.id}
              className={`neon-btn ${activePreset.id === preset.id ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => {
                setActivePreset(preset);
                setAnalysisState('idle');
                setCurrentFrame(0);
                setIsPlaying(false);
              }}
              disabled={isScanning}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{preset.title}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                  Type: {preset.type} | {preset.batsman} vs {preset.bowler}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Match Details */}
      <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Batsman:</span>
          <span><strong>{activePreset.batsman}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Bowler:</span>
          <span><strong>{activePreset.bowler}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Description:</span>
          <span style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
            {activePreset.description}
          </span>
        </div>
      </div>

      {/* Calibration Alert */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 204, 0, 0.05)',
        border: '1px dashed rgba(255, 204, 0, 0.3)',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'var(--neon-yellow)'
      }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>Drag the popping crease line overlay on the player canvas to calibrate your pitch boundaries before scanning. Current alignment: <strong>X = {calibrationX}px</strong>.</span>
      </div>

      {/* AI Analysis Scan trigger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {analysisState !== 'scanning' ? (
          <button 
            className="neon-btn neon-btn-green"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
            onClick={handleStartAnalysis}
            disabled={isScanning}
          >
            <Cpu size={18} />
            <span>RUN AI DECISION REVIEW</span>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>
              <span>{statusMsg}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--neon-cyan)', boxShadow: 'var(--glow-cyan)', transition: 'width 0.15s ease-out' }} />
            </div>
          </div>
        )}
        
        {analysisState === 'complete' && (
          <button 
            className="neon-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setAnalysisState('idle')}
          >
            <span>RESET REVIEW</span>
          </button>
        )}
      </div>
    </div>
  );
}
