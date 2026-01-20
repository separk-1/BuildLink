// src/utils/logger.ts

export interface LogEntry {
  timestamp: number;
  type: 'ACTION' | 'SNAPSHOT' | 'ALARM';
  data: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private session_id: string;

  constructor() {
    this.session_id = `session_${Date.now()}`;
    console.log(`[Logger] Initialized session: ${this.session_id}`);
  }

  logAction(action: string, details: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      type: 'ACTION',
      data: { action, details }
    };
    this.logs.push(entry);
    console.log('[ACTION]', action, details);
  }

  logSnapshot(state: any) {
    // Only log essential physics state to save space
    const snapshot = {
      fw_flow: state.fw_flow,
      sg_level: state.sg_level,
      sg_pressure: state.sg_pressure,
      power: state.reactor_power,
      alarms: {
        low_flow: state.fw_flow < 800 && state.reactor_power > 10,
        low_level: state.sg_level < 30,
        high_press: state.sg_pressure > 7.5,
        trip: state.reactor_tripped
      }
    };

    this.logs.push({
      timestamp: Date.now(),
      type: 'SNAPSHOT',
      data: snapshot
    });
  }

  exportLogs() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `npp_simulation_log_${this.session_id}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  getLogs() {
      return this.logs;
  }
}

export const logger = new Logger();
