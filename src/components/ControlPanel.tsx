import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { logger } from '../utils/logger';

export const ControlPanel = () => {
  const s = useSimulationStore();

  return (
    <>
      <div className="panel-title">
        <span>CONTROL PANEL</span>
        <button
          className="dcs-btn"
          onClick={() => logger.exportLogs()}
          style={{ padding: '2px 8px', fontSize: '0.6rem' }}
        >
          EXPORT LOGS
        </button>
      </div>
      <div className="panel-content" style={{ gap: '12px' }}>

        {/* Reactor Column */}
        <ControlColumn label="REACTOR">
            <TripButton label="TRIP REACTOR" onClick={s.toggleTripReactor} tripped={s.trip_reactor} />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%'}}>
                 <ToggleButton label="SI" active={s.activate_si} onClick={s.toggleSi} />
                 <ToggleButton label="RCP" active={s.rcp} onClick={s.toggleRcp} />
                 <ToggleButton label="PORV" active={s.porviv} onClick={s.togglePorv} />
            </div>
        </ControlColumn>

        {/* SG Column */}
        <ControlColumn label="STEAM GEN">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%'}}>
                <ToggleButton label="FW PUMP" active={s.fw_pump} onClick={s.toggleFwPump} />
                <ToggleButton label="FW IV" active={s.fwiv} onClick={s.toggleFwiv} />
                <ToggleButton label="MSIV" active={s.msiv} onClick={s.toggleMsiv} />
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

const ToggleButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`dcs-btn ${active ? 'active-green' : 'active-yellow'}`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
        <span style={{ fontSize: '0.65rem', marginBottom: '2px' }}>{label}</span>
        <span>{active ? 'ON' : 'OFF'}</span>
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
