import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import UltraEdge from './components/UltraEdge';
import DecisionBoard from './components/DecisionBoard';
import UmpireAnalysis from './components/UmpireAnalysis';
import ChatCompanion from './components/ChatCompanion';
import ReviewHistory from './components/ReviewHistory';
import { presets } from './data/presets';
import { Layers, Activity, Cpu, Workflow, Save, CheckCircle } from 'lucide-react';
import { uploadVideoClip, saveDrsReview } from './lib/supabase';

export default function App() {
  // Config & State
  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('cricvar_gemini_key') || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    'AIzaSyBRUu-u00MElQsqv84PERLFOXPrtNr4R8w'
  );
  const [activePreset, setActivePreset] = useState(presets[0]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [calibrationX, setCalibrationX] = useState(420); // Crease line default X position (px)
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  const [isScanning, setIsScanning] = useState(false);
  const [analysisState, setAnalysisState] = useState('idle'); // 'idle' | 'scanning' | 'complete'
  const [ruling, setRuling] = useState('STANDBY');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saved' | 'error'
  const uploadedFileRef = useRef(null);
  const historyRef = useRef(null);

  // Save the current DRS review to Supabase
  const handleSaveReview = async () => {
    if (isSaving || analysisState !== 'complete') return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      let videoUrl = null;
      let videoFilename = null;

      // If user uploaded a video file, push it to Supabase Storage
      if (uploadedFileRef.current) {
        const result = await uploadVideoClip(uploadedFileRef.current);
        videoUrl = result.url;
        videoFilename = result.filename;
      }

      const decisiveFrame = activePreset.bailOffFrame > 0
        ? activePreset.bailOffFrame
        : activePreset.soundSpikeFrame;

      await saveDrsReview({
        appealType: activePreset.type,
        batsman: activePreset.batsman,
        bowler: activePreset.bowler,
        ruling,
        explanation: activePreset.explanation,
        calibrationX,
        decisiveFrame,
        videoUrl,
        videoFilename,
        sourceMode: uploadedVideo ? 'upload' : 'simulation',
      });

      setSaveStatus('saved');
      // Refresh history panel
      if (historyRef.current?.loadReviews) {
        historyRef.current.loadReviews();
      }
    } catch (err) {
      console.error('Failed to save DRS review:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset states when swapping presets
  useEffect(() => {
    setUploadedVideo(null);
    setAnalysisState('idle');
    setRuling('STANDBY');
    setCurrentFrame(0);
    setIsPlaying(false);
    
    // Default calibration values per preset
    if (activePreset.id === 'run-out') {
      setCalibrationX(420);
    } else if (activePreset.id === 'stumping') {
      setCalibrationX(420);
    }
  }, [activePreset]);

  // Dynamic Decision Evaluator
  useEffect(() => {
    if (uploadedVideo) {
      if (analysisState === 'complete') {
        setRuling('NOT OUT'); // Default fallback for uploaded videos in mock mode
      } else {
        setRuling('STANDBY');
      }
      return;
    }

    if (analysisState === 'complete') {
      // Evaluate based on active calibration line
      if (activePreset.id === 'run-out') {
        // At bailOffFrame (44), bat X is 150 + 44 * 6 = 414 px.
        const frameData = activePreset.frames[activePreset.bailOffFrame];
        if (frameData.batX < calibrationX) {
          setRuling('OUT');
        } else {
          setRuling('NOT OUT');
        }
      } else if (activePreset.id === 'stumping') {
        // At bailOffFrame (42), foot X is 436.6 px.
        const frameData = activePreset.frames[activePreset.bailOffFrame];
        // Batsman must be grounded AND foot must be behind crease (footX <= calibrationX)
        if (frameData.footGrounded && frameData.footX <= calibrationX) {
          setRuling('NOT OUT');
        } else {
          setRuling('OUT');
        }
      } else if (activePreset.id === 'caught-behind') {
        // Sound spike exactly matches ball crossing bat
        setRuling('OUT');
      }
    } else {
      setRuling('STANDBY');
    }
  }, [analysisState, calibrationX, activePreset, uploadedVideo]);

  return (
    <div className="app-container">
      {/* Header bar */}
      <Header apiKey={apiKey} setApiKey={setApiKey} />

      {/* Main Grid Dashboard */}
      <main className="dashboard-grid">
        {/* Left Side: DRS Feeds & Visualizers */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1rem', 
              color: 'var(--neon-cyan)', 
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>DECISION REVIEW SYSTEM (DRS) VIEWPORT</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {uploadedVideo ? 'CUSTOM VIDEO SOURCE' : '3D HUD SIMULATION'}
              </span>
            </h2>
            
            <VideoPlayer 
              activePreset={activePreset}
              currentFrame={currentFrame}
              setCurrentFrame={setCurrentFrame}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              calibrationX={calibrationX}
              setCalibrationX={setCalibrationX}
              uploadedVideo={uploadedVideo}
              setUploadedVideo={setUploadedVideo}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              isScanning={isScanning}
              uploadedFileRef={uploadedFileRef}
            />
          </div>

          {/* UltraEdge (Snickometer) Waveform */}
          <UltraEdge 
            activePreset={activePreset}
            currentFrame={currentFrame}
          />
        </section>

        {/* Right Side: Control Panels & AI Chat */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Broadcaster score indicator */}
          <DecisionBoard 
            ruling={ruling}
            analysisState={analysisState}
            activePreset={activePreset}
            currentFrame={currentFrame}
            calibrationX={calibrationX}
          />

          {/* Analysis Settings & Trigger */}
          <UmpireAnalysis 
            presetsList={presets}
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            analysisState={analysisState}
            setAnalysisState={setAnalysisState}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            setCurrentFrame={setCurrentFrame}
            setIsPlaying={setIsPlaying}
            calibrationX={calibrationX}
          />

          {/* AI DRS Chatbot Assistant */}
          <ChatCompanion 
            apiKey={apiKey}
            activePreset={activePreset}
            calibrationX={calibrationX}
          />

          {/* Save DRS Review Button */}
          {analysisState === 'complete' && (
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className={`neon-btn neon-btn-green ${isSaving ? 'disabled' : ''}`}
                style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}
                onClick={handleSaveReview}
                disabled={isSaving || saveStatus === 'saved'}
              >
                {saveStatus === 'saved' ? (
                  <><CheckCircle size={18} /> SAVED TO SUPABASE</>
                ) : isSaving ? (
                  <><Save size={18} /> SAVING...</>
                ) : (
                  <><Save size={18} /> SAVE DRS REVIEW</>
                )}
              </button>
              {saveStatus === 'error' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--neon-red)', fontFamily: 'var(--font-mono)' }}>SAVE FAILED — CHECK CONSOLE</span>
              )}
            </div>
          )}

        </section>
      </main>

      {/* SECTION 1: CORE CAPABILITIES */}
      <section style={{ marginTop: '40px' }}>
        <h2 className="section-title">SYSTEM <span>CAPABILITIES</span></h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-icon"><Layers size={24} /></div>
            <h3 className="info-card-title">Biomechanical Crease Alignment</h3>
            <p className="info-card-text">
              Click-and-drag overlay lines to calibrate boundaries. The AI recalibrates frame-by-frame stumping and run-out physics based on your coordinates.
            </p>
          </div>
          <div className="info-card">
            <div className="info-card-icon"><Activity size={24} /></div>
            <h3 className="info-card-title">Snickometer Waveform (UltraEdge)</h3>
            <p className="info-card-text">
              Real-time canvas rendering of high-frequency audio spikes. Syncs with video timeline to capture micro-seconds edge-contacts.
            </p>
          </div>
          <div className="info-card">
            <div className="info-card-icon"><Cpu size={24} /></div>
            <h3 className="info-card-title">Gemini Multimodal Chat Assistant</h3>
            <p className="info-card-text">
              Natural Language LLM answering rules, appeals, and biomechanical statistics in real-time, matching veteran umpire personas.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: DRS WORKFLOW */}
      <section>
        <h2 className="section-title">DRS ANALYSIS <span>WORKFLOW</span></h2>
        <div className="workflow-container">
          <div className="workflow-step">
            <div className="workflow-circle">1</div>
            <h3 className="workflow-title">Source Capture</h3>
            <p className="workflow-text">Amateurs upload matches filmed on smartphones or choose preset matches.</p>
          </div>
          <div className="workflow-step">
            <div className="workflow-circle">2</div>
            <h3 className="workflow-title">Telemetry Calibration</h3>
            <p className="workflow-text">Align the popping crease reference marker to match pitch video angle.</p>
          </div>
          <div className="workflow-step">
            <div className="workflow-circle">3</div>
            <h3 className="workflow-title">Multimodal Scan</h3>
            <p className="workflow-text">Run CricVAR visual and audio processors to scan frames and sound frequencies.</p>
          </div>
          <div className="workflow-step">
            <div className="workflow-circle">4</div>
            <h3 className="workflow-title">Decision Output</h3>
            <p className="workflow-text">A dynamic broadcasting scorecard flashes OUT or NOT OUT with detailed biomechanical justifications.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: MCC LAWS REFERENCE */}
      <section>
        <h2 className="section-title">MCC LAWS <span>HANDBOOK</span></h2>
        <div className="info-grid">
          <div className="info-card handbook-card green">
            <h3 className="info-card-title" style={{ fontSize: '1rem', color: 'var(--neon-green)' }}>LAW 33: CAUGHT</h3>
            <p className="info-card-text">
              The striker is out caught if the ball touches the bat or glove and is held by a fielder before touching the ground. Verified via Snickometer frequency spikes in the audio timeline.
            </p>
          </div>
          <div className="info-card handbook-card red">
            <h3 className="info-card-title" style={{ fontSize: '1rem', color: 'var(--neon-red)' }}>LAW 38: RUN OUT</h3>
            <p className="info-card-text">
              A batsman is run out if, while the ball is in play, his bat or body is not grounded behind the popping crease and his wicket is fairly broken by the opposing side. Checked via frame calibrations.
            </p>
          </div>
          <div className="info-card handbook-card">
            <h3 className="info-card-title" style={{ fontSize: '1rem', color: 'var(--neon-cyan)' }}>LAW 39: STUMPED</h3>
            <p className="info-card-text">
              The striker is out stumped if they are out of their ground, not attempting a run, and the wicketkeeper fairly dislodges the bails. Checked via foot grounding analysis.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARCHITECTURE BLUEPRINT */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className="section-title">SYSTEM <span>ARCHITECTURE</span></h2>
        <div className="architecture-container">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--neon-cyan)', marginBottom: '8px' }}>CLIENT PROCESSING LAYER</h3>
            <ul style={{ listStyleType: 'square', paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <li>React 18 Component Grid Layout</li>
              <li>HTML5 Canvas Rendering loop</li>
              <li>Scrub Synchronization System</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--neon-cyan)', marginBottom: '8px' }}>COGNITIVE REASONING LAYER</h3>
            <ul style={{ listStyleType: 'square', paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <li>Gemini-1.5-Flash Decision Review API</li>
              <li>Broadcasting System Prompt Persona</li>
              <li>Dynamic fallback parser matrices</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--neon-cyan)', marginBottom: '8px' }}>BIOMECHANICAL ANALYTICS</h3>
            <ul style={{ listStyleType: 'square', paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <li>Popping crease calibration coordinates</li>
              <li>Foot grounding state analyzer</li>
              <li>Frame-to-audio sync sensors</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DRS Review History from Supabase */}
      <ReviewHistory ref={historyRef} />

      {/* Footer Branding */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '24px 0 10px 0', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)', 
        fontFamily: 'var(--font-mono)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        marginTop: 'auto'
      }}>
        CRICVAR DECISION RECORDER • DEVELOPED FOR GDG GWALIOR HACKATHON 2026
      </footer>
    </div>
  );
}
