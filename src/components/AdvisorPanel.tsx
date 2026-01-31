import { useState } from 'react';
import { askGemini } from '../utils/gemini';
import { useSimulationStore } from '../store/simulationStore';
import { useGraphData } from '../hooks/useGraphData';
import { FormattedText } from '../utils/markdown';

export const AdvisorPanel = () => {
  const [messages, setMessages] = useState<{sender: 'AI' | 'User', text: string}[]>([
    { sender: 'AI', text: 'System Initialized. Monitoring LOFW scenario.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const simState = useSimulationStore();
  const { entityCsv, relationshipCsv, loading: graphLoading } = useGraphData();

  const handleSend = async () => {
    if (!input.trim()) return;

    if (graphLoading) {
         setMessages(prev => [...prev, { sender: 'AI', text: 'System loading knowledge graph. Please wait...' }]);
         return;
    }

    const userQuestion = input;
    setMessages(prev => [...prev, { sender: 'User', text: userQuestion }]);
    setInput('');
    setLoading(true);

    // Construct Context (Simulation State + Simplified Graph)
    const context = `
    CURRENT SIMULATION STATE:
    FW Flow: ${simState.fw_flow.toFixed(1)} L/s
    SG Level: ${simState.sg_level.toFixed(1)} %
    Steam Press: ${simState.steam_press.toFixed(1)} kg/cm2
    Reactor Power: ${simState.reactivity.toFixed(1)} %
    Turbine Speed: ${simState.turbine_rpm.toFixed(0)} RPM
    Alarms Active: ${simState.fw_low_flow ? 'FW_LOW_FLOW' : ''} ${simState.sg_low_level ? 'SG_LOW_LEVEL' : ''} ${simState.trip_reactor ? 'REACTOR_TRIPPED' : ''}

    RELEVANT PROCEDURES (Knowledge Graph Entities):
    ${entityCsv}

    RELATIONSHIPS:
    ${relationshipCsv}
    `;

    try {
        const answer = await askGemini(userQuestion, context);
        setMessages(prev => [...prev, { sender: 'AI', text: answer }]);
    } catch (error) {
        setMessages(prev => [...prev, { sender: 'AI', text: 'Connection failed. System offline.' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <div className="panel-title">
        <span>AI ADVISOR (GraphRAG)</span>
        <span style={{ fontSize: '0.6rem', color: '#22c55e' }}>
            ONLINE
        </span>
      </div>
      <div className="panel-content" style={{ flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Chat History */}
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <FormattedText text={msg.text} />
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
