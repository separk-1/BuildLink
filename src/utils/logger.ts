// src/utils/logger.ts

export interface LogEntry {
  timestamp: string; // Changed to ISO string for better readability/parsing
  type: 'ACTION' | 'SNAPSHOT';
  data: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private session_id: string;

  constructor() {
    this.session_id = `session_${Date.now()}`;
    console.log(`[Logger] Initialized session: ${this.session_id}`);
  }

  // Action Log: timestamp, action_type, target, value, user_id
  logAction(action_type: string, details: { target?: string, value?: any, [key: string]: any }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'ACTION',
      data: {
        session_id: this.session_id,
        action_type,
        ...details
      }
    };
    this.logs.push(entry);
    console.log('[ACTION]', action_type, details);
  }

  // Snapshot Log: timestamp, all variables
  logSnapshot(state: any) {
    // Only log essential physics state
    const snapshot = {
      session_id: this.session_id,
      fw_flow: state.fw_flow,
      sg_level: state.sg_level,
      sg_pressure: state.sg_pressure,
      reactor_power: state.reactor_power,
      turbine_speed: state.turbine_speed,
      // Log controls state as well for context
      fw_cv: state.fw_cv,
      fw_pump: state.fw_pump_on,
      alarms: state.alarms || [] // Expecting store to provide active alarms
    };

    this.logs.push({
      timestamp: new Date().toISOString(),
      type: 'SNAPSHOT',
      data: snapshot
    });
  }

  exportLogs() {
    const exportData = {
      session_id: this.session_id,
      generated_at: new Date().toISOString(),
      logs: this.logs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `npp_log_${this.session_id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  getLogs() {
      return this.logs;
  }
}

export const logger = new Logger();
