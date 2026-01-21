import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { logger } from '../utils/logger';

export const ControlPanel = () => {
  const s = useSimulationStore();

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
      <div className="panel-content" style={{ flexDirection: 'row', gap: '10px', padding: '10px', alignItems: 'flex-start' }}>

        {/* Reactor Column */}
        <ControlColumn label="REACTOR">
            <TripButton label="TRIP REACTOR" onClick={s.toggleTripReactor} tripped={s.trip_reactor} />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', width: '100%'}}>
                 <ToggleButton label="SI" active={s.activate_si} onClick={s.toggleSi} />
                 <ToggleButton label="RCP" active={s.rcp} onClick={s.toggleRcp} />
                 <ToggleButton label="PORV" active={s.porviv} onClick={s.togglePorv} />
            </div>
        </ControlColumn>

        {/* SG Column */}
        <ControlColumn label="STEAM GEN">
            <div style={{display: 'flex', gap: '5px', width: '100%'}}>
                <ToggleButton label="FW PUMP" active={s.fw_pump} onClick={s.toggleFwPump} />
                <ToggleButton label="FW IV" active={s.fwiv} onClick={s.toggleFwiv} />
                <ToggleButton label="MSIV" active={s.msiv} onClick={s.toggleMsiv} />
            </div>

            <div style={{borderTop: '1px solid #ccc', margin: '5px 0', width: '100%'}}></div>

            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                <span style={{fontSize: '0.7rem', fontWeight: 'bold'}}>FW CONTROL</span>
                <button
                    onClick={s.toggleFwcvMode}
                    style={{ fontSize: '0.6rem', padding: '2px 6px', backgroundColor: s.fwcv_mode ? '#3b82f6' : '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                    {s.fwcv_mode ? 'AUTO' : 'MANUAL'}
                </button>
            </div>

            <Slider label="FW CV %" value={s.fwcv_degree} onChange={s.setFwcvDegree} disabled={s.fwcv_mode} />

        </ControlColumn>

        {/* Turbine Column */}
        <ControlColumn label="TURBINE">
             <TripButton label="TRIP TURBINE" onClick={s.toggleTripTurbine} tripped={s.trip_turbine} />

             <Slider label="SPEED CV" value={s.turbine_speed_cv} onChange={s.setTurbineSpeedCv} />
             <Slider label="LOAD CV" value={s.turbine_load_cv} onChange={s.setTurbineLoadCv} />
             <Slider label="BYPASS CV" value={s.turbine_bypass_cv} onChange={s.setTurbineBypassCv} />
        </ControlColumn>

      </div>
    </>
  );
};

const ControlColumn = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '8px',
    border: '1px solid #9ca3af', padding: '8px', borderRadius: '4px', flex: 1, height: '100%', backgroundColor: '#f9fafb'
  }}>
    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px', textAlign: 'center' }}>
        {label}
    </div>
    {children}
  </div>
);

const ToggleButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1, padding: '8px 2px',
            backgroundColor: active ? '#22c55e' : '#eab308',
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem'
        }}
    >
        {label}<br/>
        {active ? 'ON/OPEN' : 'OFF/CLSD'}
    </button>
);

const TripButton = ({ label, onClick, tripped }: { label: string, onClick: () => void, tripped: boolean }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%', padding: '10px',
            backgroundColor: '#dc2626',
            color: 'white', border: tripped ? '3px solid black' : '1px solid #7f1d1d',
            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
            opacity: tripped ? 0.6 : 1
        }}
    >
        {label}
    </button>
);

const Slider = ({ label, value, onChange, disabled = false }: { label: string, value: number, onChange: (val: number) => void, disabled?: boolean }) => (
    <div style={{ width: '100%', opacity: disabled ? 0.5 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#374151' }}>
            <span>{label}</span>
            <span>{(value * 100).toFixed(0)}%</span>
        </div>
        <input
            type="range"
            min="0" max="1" step="0.1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            disabled={disabled}
            style={{ width: '100%', cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
    </div>
);
