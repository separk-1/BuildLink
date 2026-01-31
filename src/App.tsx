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
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-green-500 p-10 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.3)] text-center max-w-2xl w-full mx-4 relative overflow-hidden">

            {/* Background Texture/Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>

            <div className="relative z-10">
                <div className="inline-block mb-6 rounded-full bg-green-500/10 p-4 border border-green-500/30">
                    <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>

                <h2 className="text-4xl font-black text-white tracking-widest mb-2 uppercase font-mono">
                    System Stabilized
                </h2>
                <div className="h-1 w-32 bg-green-500 mx-auto mb-6"></div>

                <p className="text-xl text-green-400 font-mono mb-8">
                    CRITICAL SAFETY FUNCTION RESTORED.<br/>
                    SCENARIO COMPLETED SUCCESSFULLY.
                </p>

                <div className="grid grid-cols-2 gap-4 text-left bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-8 font-mono text-sm text-slate-300">
                    <div>
                        <span className="block text-slate-500 text-xs uppercase">Plant Status</span>
                        <span className="text-green-400 font-bold">NORMAL</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs uppercase">Core Reactivity</span>
                        <span className="text-white">STABLE</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs uppercase">Cooling</span>
                        <span className="text-white">ESTABLISHED</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs uppercase">Safety Injection</span>
                        <span className="text-white">STANDBY</span>
                    </div>
                </div>

                <button
                  onClick={() => {
                    resetSimulation();
                    window.location.reload();
                  }}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg border border-green-400 font-mono tracking-wider"
                >
                  ACKNOWLEDGE & RESTART SYSTEM
                </button>
            </div>
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
