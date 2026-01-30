import React from 'react';
import { useSimulationStore, type ScenarioPreset } from '../store/simulationStore';
import { logger } from '../utils/logger';

const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const ControlPanel = () => {
  const s = useSimulationStore();

  return (
    <>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>CONTROL PANEL</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-info)' }}>
            {formatTime(s.time)}
        </span>
      </div>

      <div className="panel-content" style={{ gap: '12px' }}>

        {/* Reactor Column */}
        <ControlColumn label="REACTOR">
            <TripButton label="TRIP REACTOR" onClick={s.toggleTripReactor} tripped={s.trip_reactor} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <ToggleButton label="Safety Injection" active={s.activate_si} onClick={s.toggleSi} />
                 <ToggleButton label="Reactor Coolant Pump" active={s.rcp} onClick={s.toggleRcp} />
                 <ToggleButton label="Power Operated Relief Valve" active={s.porviv} onClick={s.togglePorv} onLabel="OPEN" offLabel="CLOSE" />
            </div>
        </ControlColumn>

        {/* SG Column */}
        <ControlColumn label="STEAM GENERATOR">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ToggleButton label="Feedwater Pump" active={s.fw_pump} onClick={s.toggleFwPump} />
                <ToggleButton label="Feedwater Isolation Valve" active={s.fwiv} onClick={s.toggleFwiv} onLabel="OPEN" offLabel="CLOSE" />
                <ToggleButton label="Main Steam Isolation Valve" active={s.msiv} onClick={s.toggleMsiv} onLabel="OPEN" offLabel="CLOSE" />
            </div>

            <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                <span style={{fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)'}}>FW CONTROL</span>
                <button
                    className={`dcs-btn ${s.fwcv_mode ? 'active-green' : ''}`}
                    onClick={s.toggleFwcvMode}
                    style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                >
                    {s.fwcv_mode ? 'AUTO' : 'MANUAL'}
                </button>
            </div>

            <Slider label="Feedwater Control Valve" value={s.fwcv_degree} onChange={s.setFwcvDegree} disabled={s.fwcv_mode} />

        </ControlColumn>

        {/* Turbine Column */}
        <ControlColumn label="TURBINE">
             <TripButton label="TRIP TURBINE" onClick={s.toggleTripTurbine} tripped={s.trip_turbine} />

             <Slider label="Turbine Speed Control Valve" value={s.turbine_speed_cv} onChange={s.setTurbineSpeedCv} />
             <Slider label="Turbine Load Control Valve" value={s.turbine_load_cv} onChange={s.setTurbineLoadCv} />
             <Slider label="Turbine Bypass Control Valve" value={s.turbine_bypass_cv} onChange={s.setTurbineBypassCv} />
        </ControlColumn>

      </div>

      <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'flex-end'
      }}>
            {/* Scenario Selector (Only when Training Mode is OFF) */}
            {!s.trainingMode && (
                <select
                    className="dcs-select"
                    style={{ flex: 1, minWidth: 0 }}
                    value={s.scenarioPreset}
                    onChange={(e) => {
                        s.setScenarioPreset(e.target.value as ScenarioPreset);
                    }}
                    title="Scenario Preset"
                >
                    <option value="cv">SCENARIO A</option>
                    <option value="pump">SCENARIO B</option>
                    <option value="hard">SCENARIO C</option>
                </select>
            )}

             {/* Training Mode Toggle */}
             <button
                className={`dcs-btn ${s.trainingMode ? 'active-red' : ''}`}
                onClick={s.toggleTrainingMode}
                style={{ padding: '2px 6px', fontSize: '0.6rem', minWidth: '40px' }}
                title="Training Mode (Randomness)"
             >
                TRN: {s.trainingMode ? 'ON' : 'OFF'}
             </button>

            <button
                className="dcs-btn"
                onClick={s.resetSimulation}
                style={{ padding: '2px 8px', fontSize: '0.6rem' }}
            >
                RESTART
            </button>

            <button
                className="dcs-btn"
                onClick={() => logger.exportLogs()}
                style={{ padding: '2px 8px', fontSize: '0.6rem' }}
            >
                LOGS
            </button>
      </div>
    </>
  );
};

const ControlColumn = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="control-col">
    <div className="control-col-header">
        {label}
    </div>
    {children}
  </div>
);

const ToggleButton = ({ label, active, onClick, onLabel = 'ON', offLabel = 'OFF' }: { label: string, active: boolean, onClick: () => void, onLabel?: string, offLabel?: string }) => (
    <button
        onClick={onClick}
        className={`dcs-btn ${active ? 'active-green' : ''}`}
        style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', minHeight: '36px' }}
    >
        <span style={{ fontSize: '0.7rem', textAlign: 'left', marginRight: '8px', lineHeight: '1.1' }}>{label}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{active ? onLabel : offLabel}</span>
    </button>
);

const TripButton = ({ label, onClick, tripped }: { label: string, onClick: () => void, tripped: boolean }) => (
    <button
        onClick={onClick}
        className={`dcs-btn active-red`}
        style={{
            width: '100%', padding: '12px',
            border: tripped ? '2px solid #000' : '1px solid #7f1d1d',
            opacity: tripped ? 0.7 : 1,
            fontSize: '0.85rem', letterSpacing: '0.05em',
            marginBottom: '8px'
        }}
    >
        {label}
    </button>
);

const Slider = ({ label, value, onChange, disabled = false }: { label: string, value: number, onChange: (val: number) => void, disabled?: boolean }) => (
    <div className="dcs-slider-container" style={{ opacity: disabled ? 0.5 : 1 }}>
        <div className="dcs-slider-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.7rem', lineHeight: '1.1' }}>{label}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--color-info)', fontSize: '0.8rem' }}>{(value * 100).toFixed(0)}%</span>
        </div>
        <input
            type="range"
            min="0" max="1" step="0.1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="dcs-slider"
        />
    </div>
);
