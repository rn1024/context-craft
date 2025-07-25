export function createLogger(name: string) {
  return {
    info: (message: string, data?: any) => {
      console.error(`[${name}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, error?: any) => {
      console.error(`[${name}] ERROR: ${message}`, error);
    },
    debug: (message: string, data?: any) => {
      if (process.env.DEBUG) {
        console.error(`[${name}] DEBUG: ${message}`, data);
      }
    }
  };
}