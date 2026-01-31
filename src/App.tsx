import { useEffect } from 'react';
import { StatusPanel } from './components/StatusPanel';
import { ControlPanel } from './components/ControlPanel';
import { AdvisorPanel } from './components/AdvisorPanel';
import { ProcedurePanel } from './components/ProcedurePanel';
import { useSimulationStore } from './store/simulationStore';
import './App.css';

function App() {
  const loadProcedureRules = useSimulationStore(state => state.loadProcedureRules);
  const simulationEnded = useSimulationStore(state => state.simulationEnded);
  const resetSimulation = useSimulationStore(state => state.resetSimulation);

  useEffect(() => {
    // Initial load of rules
    loadProcedureRules().then(() => {
       // Trigger the initial step's logic after rules are loaded
       const state = useSimulationStore.getState();
       if (state.activeStepId) {
           state.triggerStepAction(state.activeStepId);
       }
    });
  }, []);

  return (
    <div className="app-container relative">
      {/* Simulation Ended Overlay */}
      {simulationEnded && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center'
          }}>
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-green-500/20 p-4 border border-green-500/50">
                        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </div>

                <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '10px',
                    letterSpacing: '0.05em'
                }}>
                    SCENARIO COMPLETE
                </h2>

                <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '30px', lineHeight: '1.5' }}>
                    The plant has been successfully stabilized.<br/>
                    All safety functions are restored.
                </p>

                <button
                  onClick={() => {
                    resetSimulation();
                    window.location.reload();
                  }}
                  className="dcs-btn"
                  style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1rem',
                      borderColor: '#22c55e',
                      color: '#22c55e'
                  }}
                >
                  RETURN TO MAIN MENU
                </button>
          </div>
        </div>
      )}

      {/* Left Column: Simulator (65%) */}
      <div className="col-sim">
        {/* Top: Status Display (65%) */}
        <div className="status-panel panel-container">
          <StatusPanel />
        </div>
        {/* Bottom: Control Panel (35%) */}
        <div className="control-panel panel-container">
          <ControlPanel />
        </div>
      </div>

      {/* Right Column: Support (35%) */}
      <div className="col-support">
        {/* Top: AI Advisor (40%) */}
        <div className="advisor-panel panel-container">
          <AdvisorPanel />
        </div>
        {/* Bottom: Procedures (60%) */}
        <div className="procedure-panel panel-container">
          <ProcedurePanel />
        </div>
      </div>
    </div>
  );
}

export default App;
