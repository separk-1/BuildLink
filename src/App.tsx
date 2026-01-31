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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 border-2 border-green-500 p-8 rounded-lg shadow-2xl text-center max-w-md">
            <h2 className="text-3xl font-bold text-green-400 mb-4">SCENARIO COMPLETE</h2>
            <p className="text-slate-300 mb-6">
              You have successfully completed the procedure.
              The system is stable.
            </p>
            <button
              onClick={() => {
                resetSimulation();
                window.location.reload(); // Force full reload to ensure clean state
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition-colors"
            >
              Restart Simulation
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
