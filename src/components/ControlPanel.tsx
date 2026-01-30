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

      {/* Scenario Selector - Top Position */}
      {!s.trainingMode && (
        <div style={{ padding: '0 12px 8px 12px' }}>
            <select
                className="dcs-select"
                style={{ width: '100%' }}
                value={s.scenarioPreset}
                onChange={(e) => {
                    if (window.confirm("Changing scenario will reset the simulation. Continue?")) {
                        s.setScenarioPreset(e.target.value as ScenarioPreset);
                    }
                }}
                title="Scenario Preset"
            >
                <option value="cv">Scenario A: CV Issue</option>
                <option value="pump">Scenario B: Pump Issue</option>
                <option value="hard">Scenario C: Hard Fail</option>
            </select>
        </div>
      )}

      <div className="panel-content" style={{ gap: '12px' }}>

        {/* Reactor Column */}
        <ControlColumn label="REACTOR">
            <TripButton label="TRIP REACTOR" onClick={s.toggleTripReactor} tripped={s.trip_reactor} />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%'}}>
                 <ToggleButton label="SI" active={s.activate_si} onClick={s.toggleSi} />
                 <ToggleButton label="RCP" active={s.rcp} onClick={s.toggleRcp} />
                 <ToggleButton label="PORV" active={s.porviv} onClick={s.togglePorv} onLabel="OPEN" offLabel="CLOSE" />
            </div>
        </ControlColumn>

        {/* SG Column */}
        <ControlColumn label="STEAM GEN">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%'}}>
                <ToggleButton label="FW PUMP" active={s.fw_pump} onClick={s.toggleFwPump} />
                <ToggleButton label="FW IV" active={s.fwiv} onClick={s.toggleFwiv} onLabel="OPEN" offLabel="CLOSE" />
                <ToggleButton label="MSIV" active={s.msiv} onClick={s.toggleMsiv} onLabel="OPEN" offLabel="CLOSE" />
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

      <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'flex-end'
      }}>
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
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
        <span style={{ fontSize: '0.65rem', marginBottom: '2px' }}>{label}</span>
        <span>{active ? onLabel : offLabel}</span>
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
            fontSize: '0.85rem', letterSpacing: '0.05em'
        }}
    >
        {label}
    </button>
);

const Slider = ({ label, value, onChange, disabled = false }: { label: string, value: number, onChange: (val: number) => void, disabled?: boolean }) => (
    <div className="dcs-slider-container" style={{ opacity: disabled ? 0.5 : 1 }}>
        <div className="dcs-slider-label">
            <span>{label}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--color-info)' }}>{(value * 100).toFixed(0)}%</span>
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
