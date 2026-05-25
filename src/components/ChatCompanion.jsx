import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, HelpCircle } from 'lucide-react';

export default function ChatCompanion({ apiKey, activePreset, calibrationX }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "CricVAR System ready. I can explain the rulings for our active case or answer any queries regarding MCC Cricket Laws (Run Out: Law 38, Stumping: Law 39, Caught Behind: Law 33). Ask me anything!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Client side fetch call to Gemini
  const callGemini = async (userPrompt) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are CricVAR, an AI Assistant in the Cricket Decision Review System (DRS) booth. 
                    You analyze match appeals and explain rules.
                    
                    Current context of active incident:
                    - Appeal Type: ${activePreset.type}
                    - Batsman: ${activePreset.batsman}
                    - Bowler: ${activePreset.bowler}
                    - Presumed Verdict: ${activePreset.ruling}
                    - Calibration Crease Boundary (X coordinate): ${calibrationX}px
                    
                    Explain things professionally, like a veteran third umpire. Keep your response short and concise (max 3 sentences).
                    
                    User question: ${userPrompt}`
                  }
                ]
              }
            ]
          })
        }
      );
      
      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
      }
      return "Unable to parse response from Gemini API. Please check your network connection or API Key validity.";
    } catch (err) {
      console.error(err);
      return "Error contacting Google Gemini API. Please check your console log or network connection.";
    }
  };

  // Rule-based simulation responder (Fallback mode)
  const getMockResponse = (input) => {
    const query = input.toLowerCase();
    
    if (query.includes('run out') || query.includes('runout')) {
      return "Under MCC Law 38, a batsman is run out if, while the ball is in play, his bat or person is not grounded behind the popping crease and his wicket is fairly broken by the opposing side. In our active case, R. Sharma's bat was short of the line at the exact moment the bails dislodged.";
    }
    
    if (query.includes('stumping') || query.includes('stumped')) {
      return "According to Law 39, a stumping requires the batsman to be out of his ground, not attempting a run, and the wicketkeeper fairly putting the wicket down. If the foot is in the air (as in our Kohli preset at frame 42) with no part grounded behind the crease, the batsman is OUT.";
    }
    
    if (query.includes('snick') || query.includes('edge') || query.includes('ultraedge') || query.includes('ultra edge')) {
      return "UltraEdge/Snickometer synchronizes high-speed camera footage with an audio feed from the stumps. A sharp audio spike occurring exactly as the ball crosses the bat (as seen in our caught-behind appeal at frame 32) indicates contact and leads to a Caught Behind ruling.";
    }
    
    if (query.includes('crease') || query.includes('line')) {
      return `The popping crease is the line representing safety. The line itself is part of the crease; thus, some part of the batsman's bat or foot must be grounded *behind* the line. Currently, the crease calibration boundary in our simulator is calibrated at X = ${calibrationX}px.`;
    }

    if (query.includes('umpire') || query.includes('rule')) {
      return "As an AI Umpire, I analyze synchronized camera frames, audio timelines (Snicko), and crease boundaries. I use these parameters to apply the official MCC Laws of Cricket for stumpings, run-outs, and caught behind decisions.";
    }

    return "I am currently in SIMULATION MODE. Please enter your Gemini API Key in the CONFIG panel to converse with the live AI engine. I can, however, answer queries about 'run out', 'stumping', 'ultraedge', or 'crease boundaries' offline.";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    const prompt = inputText;
    setInputText('');
    setIsLoading(true);

    let reply = '';
    if (apiKey) {
      reply = await callGemini(prompt);
    } else {
      // Simulate typing delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      reply = getMockResponse(prompt);
    }

    setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    setIsLoading(false);
  };

  return (
    <div className="glass-panel chat-container">
      <h3 style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: '0.9rem', 
        color: 'var(--neon-cyan)', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        padding: '16px 20px 8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Sparkles size={16} className={apiKey ? 'pulse' : ''} style={{ color: apiKey ? 'var(--neon-cyan)' : 'var(--text-muted)' }} />
        <span>AI DRS ASSISTANT</span>
      </h3>

      {/* Messages area */}
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble ai" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)' }}></span>
            <span className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', animationDelay: '0.2s' }}></span>
            <span className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', animationDelay: '0.4s' }}></span>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          className="chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={apiKey ? "Ask CricVAR about this incident..." : "Type rule keywords (e.g. 'run out')..."}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="neon-btn neon-btn-green" 
          style={{ padding: '8px 12px' }}
          disabled={isLoading || !inputText.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
