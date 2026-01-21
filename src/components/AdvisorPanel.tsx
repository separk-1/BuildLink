import { useState } from 'react';

export const AdvisorPanel = () => {
  const [messages, setMessages] = useState<{sender: 'AI' | 'User', text: string}[]>([
    { sender: 'AI', text: 'System Initialized. Monitoring LOFW scenario.' },
    { sender: 'AI', text: 'Please verify Feedwater Flow matches nominal values.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: 'User', text: input }]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'AI', text: 'Acknowledged. Analyzing procedure step...' }]);
    }, 1000);
  };

  return (
    <>
      <div className="panel-title">
        <span>AI ADVISOR</span>
        <span style={{ fontSize: '0.6rem', color: '#22c55e' }}>ONLINE</span>
      </div>
      <div className="panel-content" style={{ flexDirection: 'column', padding: 0 }}>

        {/* Chat History */}
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((msg, idx) => (
                <div key={idx} style={{
                    alignSelf: msg.sender === 'User' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    backgroundColor: msg.sender === 'User' ? '#3b82f6' : '#334155',
                    color: '#f1f5f9',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{msg.sender}</div>
                    {msg.text}
                </div>
            ))}
        </div>

        {/* Input Area */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', background: 'var(--bg-panel-light)' }}>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Advisor..."
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
                style={{ padding: '4px 10px' }}
            >
                SEND
            </button>
        </div>
      </div>
    </>
  );
};
