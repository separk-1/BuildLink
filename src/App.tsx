import { StatusPanel } from './components/StatusPanel';
import { ControlPanel } from './components/ControlPanel';
import { AdvisorPanel } from './components/AdvisorPanel';
import { ProcedurePanel } from './components/ProcedurePanel';
import './App.css';

function App() {
  return (
    <div className="app-container">
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
