import { useState } from 'react';
import { askGemini } from '../utils/gemini';
import { GEMINI_API_KEY as ConfigKey } from '../config'; // Import from config (might be empty)
import { ENTITY_CSV, RELATIONSHIP_CSV } from '../data/graphData';
import { useSimulationStore } from '../store/simulationStore';

export const AdvisorPanel = () => {
  const [messages, setMessages] = useState<{sender: 'AI' | 'User', text: string}[]>([
    { sender: 'AI', text: 'System Initialized. Monitoring LOFW scenario.' },
  ]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(ConfigKey || ''); // Use config key if present
  const [loading, setLoading] = useState(false);

  const simState = useSimulationStore();

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check API Key
    if (!apiKey) {
        setMessages(prev => [...prev, { sender: 'AI', text: 'Please enter a Gemini API Key to enable AI support.' }]);
        return;
    }

    const userQuestion = input;
    setMessages(prev => [...prev, { sender: 'User', text: userQuestion }]);
    setInput('');
    setLoading(true);

    // Construct Context (Simulation State + Simplified Graph)
    // We pass the raw CSV lines as context to save token space vs structured JSON,
    // or we could parse. For now, raw CSV is surprisingly effective for LLMs.
    const context = `
    CURRENT SIMULATION STATE:
    FW Flow: ${simState.fw_flow.toFixed(1)} L/s
    SG Level: ${simState.sg_level.toFixed(1)} %
    Steam Press: ${simState.steam_press.toFixed(1)} kg/cm2
    Reactor Power: ${simState.reactivity.toFixed(1)} %
    Turbine Speed: ${simState.turbine_rpm.toFixed(0)} RPM
    Alarms Active: ${simState.fw_low_flow ? 'FW_LOW_FLOW' : ''} ${simState.sg_low_level ? 'SG_LOW_LEVEL' : ''} ${simState.trip_reactor ? 'REACTOR_TRIPPED' : ''}

    RELEVANT PROCEDURES (Knowledge Graph Entities):
    ${ENTITY_CSV}

    RELATIONSHIPS:
    ${RELATIONSHIP_CSV}
    `;

    try {
        const answer = await askGemini(userQuestion, context, apiKey);
        setMessages(prev => [...prev, { sender: 'AI', text: answer }]);
    } catch (error) {
        setMessages(prev => [...prev, { sender: 'AI', text: 'Connection failed. Please check API Key.' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <div className="panel-title">
        <span>AI ADVISOR (GraphRAG)</span>
        <span style={{ fontSize: '0.6rem', color: apiKey ? '#22c55e' : '#eab308' }}>
            {apiKey ? 'CONNECTED' : 'NO KEY'}
        </span>
      </div>
      <div className="panel-content" style={{ flexDirection: 'column', padding: 0 }}>

        {/* API Key Input (if missing or want to update) */}
        {!ConfigKey && (
             <div style={{ padding: '4px 8px', background: '#334155', borderBottom: '1px solid var(--border-color)' }}>
                <input
                    type="password"
                    placeholder="Enter Gemini API Key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.7rem' }}
                />
             </div>
        )}

        {/* Chat History */}
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((msg, idx) => (
                <div key={idx} style={{
                    alignSelf: msg.sender === 'User' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: msg.sender === 'User' ? '#3b82f6' : '#334155',
                    color: '#f1f5f9',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    whiteSpace: 'pre-wrap' // Handle multiline from AI
                }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{msg.sender}</div>
                    {msg.text}
                </div>
            ))}
            {loading && <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Thinking...</div>}
        </div>

        {/* Input Area */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', background: 'var(--bg-panel-light)' }}>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Advisor..."
                disabled={loading}
                style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                }}
            />
            <button
                className="dcs-btn"
                onClick={handleSend}
                disabled={loading}
                style={{ padding: '4px 10px' }}
            >
                SEND
            </button>
        </div>
      </div>
    </>
  );
};
