import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export default function UltraEdge({ activePreset, currentFrame }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#04060b';
    ctx.fillRect(0, 0, w, h);

    // Draw background grid lines (horizontal)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 10; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Draw vertical timeline divisions
    const totalFrames = activePreset.totalFrames || 60;
    const frameWidth = w / totalFrames;
    for (let f = 0; f <= totalFrames; f += 5) {
      const x = f * frameWidth;
      ctx.strokeStyle = f % 10 === 0 ? 'rgba(0, 243, 255, 0.15)' : 'rgba(0, 243, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      
      // Draw frame labels at bottom
      if (f % 10 === 0) {
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '8px Share Tech Mono';
        ctx.fillText(`F${f}`, x + 2, h - 4);
      }
    }

    // Generate and Draw Audio Waveform
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 243, 255, 0.4)';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    for (let f = 0; f <= totalFrames; f++) {
      const x = f * frameWidth;
      const midY = h / 2 - 5; // adjust for text at bottom
      
      // Determine amplitude for this frame
      let amp = 0.05; // background noise
      
      if (activePreset.soundSpikeFrame > 0) {
        const dist = Math.abs(f - activePreset.soundSpikeFrame);
        if (dist === 0) {
          amp = 0.9; // massive contact spike
        } else if (dist === 1) {
          amp = 0.4;
        } else if (dist === 2) {
          amp = 0.15;
        } else {
          // add small random variations
          amp = 0.03 + Math.sin(f * 2.3) * 0.02;
        }
      } else {
        // general case (run out / stumping) - just low noise
        amp = 0.02 + Math.sin(f * 1.5) * 0.015;
      }

      const waveH = amp * (h - 20) * 0.9;
      
      // Draw vertical bar centered around midY (resembling sound frequency spikes)
      ctx.moveTo(x, midY - waveH / 2);
      ctx.lineTo(x, midY + waveH / 2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Draw active playhead needle
    const playheadX = currentFrame * frameWidth;
    ctx.strokeStyle = 'var(--neon-red)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();

    // Playhead arrow/handle at top
    ctx.fillStyle = 'var(--neon-red)';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 6);
    ctx.closePath();
    ctx.fill();

    // Draw Sound Spike Marker if present
    if (activePreset.soundSpikeFrame > 0 && currentFrame === activePreset.soundSpikeFrame) {
      ctx.fillStyle = 'rgba(255, 0, 85, 0.15)';
      const spikeX = activePreset.soundSpikeFrame * frameWidth;
      ctx.fillRect(spikeX - 8, 0, 16, h);
      
      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = '10px Orbitron';
      ctx.fillText("EDGE DETECTED", spikeX + 12, 18);
    }

  }, [activePreset, currentFrame]);

  return (
    <div className="glass-panel ultraedge-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--neon-cyan)' }} />
          <span className="label-title">ULTRA-EDGE SOUND SPECTRUM (SNICKOMETER)</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {activePreset.soundSpikeFrame > 0 ? 'SYNCED AUDIO FEED' : 'NO SOUND EVENTS'}
        </div>
      </div>
      
      <div className="ultraedge-canvas-wrapper">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={80} 
          className="ultraedge-canvas"
        />
      </div>
    </div>
  );
}
