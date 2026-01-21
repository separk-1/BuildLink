// src/utils/logger.ts

export interface LogEntry {
  timestamp: string;
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

  // Action Log
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

  // Snapshot Log: Dump everything that isn't a function
  logSnapshot(state: any) {
    // Filter out functions from the state object
    const cleanState: any = { session_id: this.session_id };

    for (const key in state) {
        if (typeof state[key] !== 'function' && key !== 'alarms') {
            cleanState[key] = state[key];
        }
    }

    // Note: The 'alarms' array was removed in the refactor (now individual booleans),
    // so we don't need to handle it specially, but I kept the exclusion check just in case.

    this.logs.push({
      timestamp: new Date().toISOString(),
      type: 'SNAPSHOT',
      data: cleanState
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
