import { useEffect } from 'react';
import { StatusPanel } from './components/StatusPanel';
import { ControlPanel } from './components/ControlPanel';
import { AdvisorPanel } from './components/AdvisorPanel';
import { ProcedurePanel } from './components/ProcedurePanel';
import { useSimulationStore } from './store/simulationStore';
import './App.css';

function App() {
  const activeStepId = useSimulationStore(state => state.activeStepId);

  useEffect(() => {
    // 이제 CSV/룰 관련 호출 제거
    console.log('App mounted, activeStepId:', activeStepId);
  }, [activeStepId]);

  return (
    <div className="app-container relative w-screen h-screen">
      <div className="col-sim">
        <div className="status-panel panel-container">
          <StatusPanel />
        </div>
        <div className="control-panel panel-container">
          <ControlPanel />
        </div>
      </div>

      <div className="col-support">
        <div className="advisor-panel panel-container">
          <AdvisorPanel />
        </div>
        <div className="procedure-panel panel-container">
          <ProcedurePanel />
        </div>
      </div>

      <footer className="app-footer">
        BuildLink · CMU CEE · Contact: seongeup@andrew.cmu.edu, joonsunh@andrew.cmu.edu
      </footer>
    </div>
  );
}

export default App;