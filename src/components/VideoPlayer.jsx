import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, ShieldAlert, Upload, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VideoPlayer({
  activePreset,
  currentFrame,
  setCurrentFrame,
  isPlaying,
  setIsPlaying,
  calibrationX,
  setCalibrationX,
  uploadedVideo,
  setUploadedVideo,
  playbackSpeed,
  setPlaybackSpeed,
  isScanning,
  uploadedFileRef
}) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // File upload handler
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      uploadedFileRef.current = file;
      setUploadedVideo(url);
      setIsPlaying(false);
      setCurrentFrame(0);
    }
  };

  // Calibration line drag
  const handleMouseDown = (e) => {
    if (uploadedVideo) return; // Only allow calibration drag in simulation mode
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    
    // If click is close to current calibration line
    if (Math.abs(x - calibrationX) < 15) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || uploadedVideo) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    // Limit calibration between X=350 and X=480
    setCalibrationX(Math.max(350, Math.min(480, Math.round(x))));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render simulation frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || uploadedVideo) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid floor (3D perspective)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, canvas.height);
      ctx.lineTo(canvas.width / 2 + (i - canvas.width / 2) * 0.4, 180);
      ctx.stroke();
    }
    for (let i = 180; i < canvas.height; i += 20) {
      const ratio = (i - 180) / (canvas.height - 180);
      ctx.strokeStyle = `rgba(0, 243, 255, ${0.02 + ratio * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw Turf / Pitch
    ctx.fillStyle = '#091515';
    ctx.beginPath();
    ctx.moveTo(100, canvas.height);
    ctx.lineTo(300, 180);
    ctx.lineTo(550, 180);
    ctx.lineTo(canvas.width - 100, canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.stroke();

    // Draw Crease Line (Interactive/Calibrated)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(calibrationX, 200);
    ctx.lineTo(calibrationX, canvas.height);
    ctx.stroke();

    // Draw Calibration guide lines if dragging
    if (isDragging) {
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(calibrationX - 20, 0);
      ctx.lineTo(calibrationX - 20, canvas.height);
      ctx.moveTo(calibrationX + 20, 0);
      ctx.lineTo(calibrationX + 20, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Get current frame data
    const frameData = activePreset.frames[currentFrame] || activePreset.frames[0];

    // Render Stumps
    const drawStumps = (x, y, scale = 1, bailsOn = true) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      
      const stumpW = 4 * scale;
      const stumpH = 50 * scale;
      const spacing = 8 * scale;
      
      // Three Stumps
      for (let s = -1; s <= 1; s++) {
        const sx = x + (s * spacing) - (stumpW / 2);
        ctx.fillRect(sx, y - stumpH, stumpW, stumpH);
        ctx.strokeRect(sx, y - stumpH, stumpW, stumpH);
      }

      // Draw Bails
      if (bailsOn) {
        ctx.fillStyle = 'rgba(255, 0, 85, 0.9)';
        ctx.shadowColor = 'rgba(255, 0, 85, 0.6)';
        ctx.shadowBlur = 10;
        ctx.fillRect(x - 12 * scale, y - stumpH - 4 * scale, 24 * scale, 3 * scale);
        ctx.shadowBlur = 0; // reset
      } else {
        // Flying Bails (Bails are dislodged)
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 15;
        const flyOffset = Math.min(20, (currentFrame - activePreset.bailOffFrame) * 4);
        // Bail 1 flying left
        ctx.save();
        ctx.translate(x - 8 * scale - flyOffset, y - stumpH - 12 * scale - flyOffset);
        ctx.rotate(-flyOffset * 0.05);
        ctx.fillRect(-6 * scale, -2 * scale, 12 * scale, 3 * scale);
        ctx.restore();
        // Bail 2 flying right
        ctx.save();
        ctx.translate(x + 8 * scale + flyOffset, y - stumpH - 15 * scale - flyOffset * 1.2);
        ctx.rotate(flyOffset * 0.07);
        ctx.fillRect(-6 * scale, -2 * scale, 12 * scale, 3 * scale);
        ctx.restore();
        ctx.shadowBlur = 0;
      }
    };

    if (activePreset.id === 'run-out') {
      // Draw wicket at X=450, Y=260
      drawStumps(450, 260, 1.2, frameData.bailsOn);
      
      // Draw crease mark indicator (yellow overlay line over popping crease)
      ctx.fillStyle = 'rgba(255, 204, 0, 0.1)';
      ctx.fillRect(calibrationX - 5, 200, 10, canvas.height - 200);

      // Draw Batsman sliding bat
      const batTipX = frameData.batX;
      const batY = frameData.batY;
      
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Draw slanted bat
      ctx.moveTo(batTipX, batY);
      ctx.lineTo(batTipX - 80, batY - 30);
      ctx.stroke();

      // Draw glowing bat tip focus circle
      ctx.strokeStyle = batTipX >= calibrationX ? 'var(--neon-green)' : 'var(--neon-red)';
      ctx.shadowColor = batTipX >= calibrationX ? 'var(--neon-green)' : 'var(--neon-red)';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(batTipX, batY, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Ball throw path
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(frameData.ballX, frameData.ballY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw ball trace trail
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(700, 100);
      ctx.lineTo(frameData.ballX, frameData.ballY);
      ctx.stroke();
      ctx.setLineDash([]);
      
    } else if (activePreset.id === 'stumping') {
      // Draw wicket at X=450, Y=260
      drawStumps(450, 260, 1.2, frameData.bailsOn);

      // Draw Batsman's foot
      const fX = frameData.footX;
      const fY = frameData.footY;
      const grounded = frameData.footGrounded;

      // Draw foot shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(fX, 250, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw foot (represented as stylized sneaker/shoe)
      ctx.fillStyle = grounded ? '#cbd5e1' : '#f87171';
      ctx.strokeStyle = grounded ? '#94a3b8' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fX, fY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Connection to floor line (if in air)
      if (!grounded) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(fX, fY);
        ctx.lineTo(fX, 250);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw ball passing to keeper
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(frameData.ballX, frameData.ballY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (activePreset.id === 'caught-behind') {
      // Caught Behind Edge View
      // Draw Bat at X=400, Y=220
      ctx.save();
      ctx.translate(400, 220);
      ctx.rotate(0.3); // Slanted bat profile
      
      // Draw wood body
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-10, -50, 20, 100);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -50, 20, 100);
      
      // Draw rubber grip handle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, -90, 8, 40);
      
      ctx.restore();

      // Draw ball moving past bat
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(frameData.ballX, frameData.ballY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball path line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(100, 250);
      ctx.lineTo(frameData.ballX, frameData.ballY);
      ctx.stroke();

      // Distance measurement line (if ball is close to bat edge)
      if (currentFrame >= 28 && currentFrame <= 36) {
        ctx.strokeStyle = frameData.distanceToBat < 20 ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(400, 220);
        ctx.lineTo(frameData.ballX, frameData.ballY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'var(--neon-cyan)';
        ctx.font = '9px Share Tech Mono';
        ctx.fillText(`GAP: ${(frameData.distanceToBat * 0.1).toFixed(1)}mm`, frameData.ballX - 20, frameData.ballY - 12);
      }
    }

    // Scanning visual overlay
    if (isScanning) {
      ctx.fillStyle = 'rgba(0, 243, 255, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'var(--neon-cyan)';
      ctx.shadowColor = 'var(--neon-cyan)';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      const y = (currentFrame % 10) * (canvas.height / 10);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw frame counter hud
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 150, 15, 135, 30);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(canvas.width - 150, 15, 135, 30);
    ctx.fillStyle = 'var(--neon-cyan)';
    ctx.font = '12px Share Tech Mono';
    ctx.fillText(`FRAME: ${String(currentFrame).padStart(3, '0')}/${String(activePreset.totalFrames).padStart(3, '0')}`, canvas.width - 138, 34);

  }, [activePreset, currentFrame, calibrationX, isScanning, uploadedVideo, isDragging]);

  // Video element sync for uploads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !uploadedVideo) return;
    
    // Map frame counter to video duration percentage
    const duration = video.duration || 0;
    if (duration > 0) {
      const targetTime = (currentFrame / activePreset.totalFrames) * duration;
      // Prevent small loop updates from fighting
      if (Math.abs(video.currentTime - targetTime) > 0.03) {
        video.currentTime = targetTime;
      }
    }
  }, [currentFrame, uploadedVideo]);

  // Playback timer loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      const stepTime = 1000 / (24 * playbackSpeed); // 24 FPS baseline
      interval = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= activePreset.totalFrames) {
            return 0; // Loop around
          }
          return prev + 1;
        });
      }, stepTime);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activePreset]);

  return (
    <div className="video-section">
      <div className="video-container" ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        
        {/* Top left scanner badge */}
        {isScanning && (
          <div className="scanning-text">
            <span className="pulse-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
            AI PROCESSING INCIDENT...
          </div>
        )}

        {/* HUD Crosshairs */}
        <div className="hud-crosshair"></div>

        {/* Interactive Calibration line overlay */}
        {!uploadedVideo && (
          <div className="calibration-line" style={{ left: `${(calibrationX / 800) * 100}%` }}>
            <div className="calibration-line-inner"></div>
            <div className="calibration-label">CREASE CALIBRATION</div>
          </div>
        )}

        {/* Dynamic Media View */}
        {uploadedVideo ? (
          <video 
            ref={videoRef}
            src={uploadedVideo}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            muted
            playsInline
            onLoadedMetadata={() => setCurrentFrame(0)}
          />
        ) : (
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={450} 
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        )}
      </div>

      {/* Control Actions Panel */}
      <div className="glass-panel control-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="neon-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
          
          <button className="neon-btn" onClick={() => { setIsPlaying(false); setCurrentFrame(0); }}>
            <RotateCcw size={16} />
            <span>RESET</span>
          </button>

          <div style={{ display: 'flex', gap: '2px' }}>
            <button className="neon-btn" style={{ padding: '8px 12px' }} onClick={() => setCurrentFrame(prev => Math.max(0, prev - 1))}>
              <ChevronLeft size={16} />
            </button>
            <button className="neon-btn" style={{ padding: '8px 12px' }} onClick={() => setCurrentFrame(prev => Math.min(activePreset.totalFrames, prev + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Timeline Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, margin: '0 16px' }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>000</span>
          <input 
            type="range" 
            className="timeline-slider"
            min={0}
            max={activePreset.totalFrames}
            value={currentFrame}
            onChange={(e) => { setIsPlaying(false); setCurrentFrame(parseInt(e.target.value)); }}
          />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{String(activePreset.totalFrames).padStart(3, '0')}</span>
        </div>

        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="label-title" style={{ marginRight: '4px' }}>SPEED:</span>
          {[0.25, 0.5, 1.0].map((speed) => (
            <button 
              key={speed}
              className={`neon-btn ${playbackSpeed === speed ? 'active' : ''}`}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={() => setPlaybackSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Custom Video Uploader */}
        <label className="neon-btn neon-btn-green" style={{ cursor: 'pointer' }}>
          <Upload size={16} />
          <span>UPLOAD CLIP</span>
          <input 
            type="file" 
            accept="video/*" 
            style={{ display: 'none' }}
            onChange={handleVideoUpload}
          />
        </label>
        
        {uploadedVideo && (
          <button
            className="neon-btn neon-btn-red"
            onClick={() => {
              setUploadedVideo(null);
              uploadedFileRef.current = null;
            }}
          >
            <span>CLEAR UPLOAD</span>
          </button>
        )}
      </div>
    </div>
  );
}
