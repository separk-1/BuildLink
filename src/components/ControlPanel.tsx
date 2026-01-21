import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { logger } from '../utils/logger';

export const ControlPanel = () => {
  const {
    fw_pump_on, togglePump,
    fw_iv_open, toggleFwIv,
    msiv_open, toggleMsiv,
    fw_cv, setFwCv,
    tripReactor, tripTurbine
  } = useSimulationStore();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <h2 className="panel-title" style={{ position: 'relative', top: 0, left: 0 }}>CONTROL PANEL</h2>
        <button
          onClick={() => logger.exportLogs()}
          style={{ fontSize: '0.7rem', padding: '2px 5px', cursor: 'pointer', zIndex: 20 }}
        >
          Export Logs
        </button>
      </div>
      <div className="panel-content" style={{ flexDirection: 'column', gap: '20px', padding: '20px' }}>

        {/* Top Row: Valves and Pumps */}
        <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'space-around' }}>

          <ControlGroup label="FW PUMP">
            <button
              onClick={togglePump}
              style={{
                padding: '10px',
                backgroundColor: fw_pump_on ? '#22c55e' : '#ef4444',
                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              {fw_pump_on ? 'ON' : 'OFF'}
            </button>
          </ControlGroup>

          <ControlGroup label="FW ISO VALVE">
            <button
              onClick={toggleFwIv}
              style={{
                padding: '10px',
                backgroundColor: fw_iv_open ? '#22c55e' : '#eab308',
                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              {fw_iv_open ? 'OPEN' : 'CLOSED'}
            </button>
          </ControlGroup>

          <ControlGroup label="MAIN STEAM IV">
            <button
              onClick={toggleMsiv}
              style={{
                padding: '10px',
                backgroundColor: msiv_open ? '#22c55e' : '#eab308',
                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              {msiv_open ? 'OPEN' : 'CLOSED'}
            </button>
          </ControlGroup>

        </div>

        {/* Middle Row: Sliders */}
        <div style={{ display: 'flex', width: '100%', gap: '20px' }}>
          <ControlGroup label={`FW CONTROL VALVE (${(fw_cv * 100).toFixed(0)}%)`}>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={fw_cv}
              onChange={(e) => setFwCv(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </ControlGroup>
        </div>

        {/* Bottom Row: Trips */}
        <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
           <button
              onClick={tripReactor}
              style={{
                padding: '15px 30px',
                backgroundColor: '#dc2626',
                color: 'white', border: '2px solid #7f1d1d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              TRIP REACTOR
            </button>

            <button
              onClick={tripTurbine}
              style={{
                padding: '15px 30px',
                backgroundColor: '#dc2626',
                color: 'white', border: '2px solid #7f1d1d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              TRIP TURBINE
            </button>
        </div>

      </div>
    </>
  );
};

const ControlGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '5px',
    border: '1px solid #9ca3af', padding: '10px', borderRadius: '4px', flex: 1, backgroundColor: '#f3f4f6'
  }}>
    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>{label}</span>
    {children}
  </div>
);
