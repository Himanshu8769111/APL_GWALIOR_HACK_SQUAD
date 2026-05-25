import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export default function DecisionBoard({ 
  ruling, 
  analysisState, // 'idle', 'scanning', 'complete'
  activePreset, 
  currentFrame, 
  calibrationX 
}) {
  
  const getBoardStyle = () => {
    if (analysisState === 'scanning') {
      return {
        borderColor: 'var(--neon-yellow)',
        color: 'var(--neon-yellow)',
        background: 'rgba(255, 204, 0, 0.1)',
        textShadow: '0 0 10px rgba(255, 204, 0, 0.5)'
      };
    }
    
    if (analysisState === 'complete') {
      if (ruling === 'OUT') {
        return {
          animation: 'flash-out 1.5s infinite',
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontSize: '3rem',
          fontWeight: 900,
          borderWidth: '2px',
          letterSpacing: '4px'
        };
      } else {
        return {
          animation: 'flash-notout 1.5s infinite',
          color: 'var(--text-dark)',
          fontFamily: 'var(--font-display)',
          fontSize: '3rem',
          fontWeight: 900,
          borderWidth: '2px',
          letterSpacing: '4px'
        };
      }
    }
    
    // Idle
    return {
      borderColor: 'var(--border-color)',
      color: 'var(--text-muted)',
      background: 'rgba(255, 255, 255, 0.02)'
    };
  };

  const getStatusText = () => {
    if (analysisState === 'scanning') return 'DECISION PENDING';
    if (analysisState === 'complete') return ruling;
    return 'STANDBY';
  };

  // Get live metrics based on current scrubber position
  const frameData = activePreset.frames[currentFrame] || activePreset.frames[0];
  const isBailsBroken = activePreset.bailOffFrame > 0 ? (currentFrame >= activePreset.bailOffFrame) : false;
  
  // Calculate relative safe/out status based on calibration
  const isRunOutOrStump = activePreset.id === 'run-out' || activePreset.id === 'stumping';
  let isBatsmanGrounded = true;

  if (activePreset.id === 'run-out') {
    isBatsmanGrounded = frameData.batX >= calibrationX;
  } else if (activePreset.id === 'stumping') {
    isBatsmanGrounded = frameData.footGrounded && frameData.footX <= calibrationX;
  }

  const hasEdgeSpike = activePreset.soundSpikeFrame > 0 && currentFrame >= activePreset.soundSpikeFrame;

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-cyan)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
        DECISION GRAPHIC FEED
      </h3>

      {/* Broadcasting Jumbotron */}
      <div style={{
        height: '110px',
        borderRadius: '8px',
        border: '1px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '2px',
        transition: 'all 0.5s ease',
        textAlign: 'center',
        ...getBoardStyle()
      }}>
        {getStatusText()}
      </div>

      {/* Live AI Telemetry Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Real-time telemetry (Frame {currentFrame})
        </h4>

        {isRunOutOrStump ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Wickets Broken:</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: isBailsBroken ? 'var(--neon-red)' : 'var(--neon-green)',
                fontWeight: 700
              }}>
                {isBailsBroken ? 'YES (BAILS OFF)' : 'NO (BAILS ON)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Batsman Grounded:</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: isBatsmanGrounded ? 'var(--neon-green)' : 'var(--neon-red)',
                fontWeight: 700
              }}>
                {isBatsmanGrounded ? 'YES (SAFE)' : 'NO (OUTSIDE CREASE)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Distance to Crease:</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: isBatsmanGrounded ? 'var(--neon-green)' : 'var(--neon-yellow)'
              }}>
                {isBatsmanGrounded ? '0.0 cm' : `${frameData.distanceToCrease.toFixed(1)} cm`}
              </span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ball-to-Bat Distance:</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: frameData.distanceToBat < 25 ? 'var(--neon-yellow)' : 'var(--text-muted)'
              }}>
                {(frameData.distanceToBat * 0.1).toFixed(1)} mm
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>UltraEdge Audio Peak:</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: frameData.soundAmplitude > 0.3 ? 'var(--neon-red)' : 'var(--neon-cyan)',
                fontWeight: 700
              }}>
                {(frameData.soundAmplitude * 100).toFixed(0)} dB
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contact Detected:</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: hasEdgeSpike ? 'var(--neon-red)' : 'var(--neon-green)',
                fontWeight: 700
              }}>
                {hasEdgeSpike ? 'YES (SPIKE)' : 'NO EDGE'}
              </span>
            </div>
          </>
        )}
      </div>

      {analysisState === 'complete' && (
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', padding: '8px', borderLeft: '2px solid var(--neon-cyan)', background: 'rgba(0, 243, 255, 0.02)' }}>
          <div>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>AI Verdict Explanation:</span>{' '}
            {activePreset.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
