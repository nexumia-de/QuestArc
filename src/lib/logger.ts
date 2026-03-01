/**
 * Centralized logging utility for QuestArc
 * Provides consistent logging interface for both plugin and UI contexts
 */

const LOG_PREFIX = "QuestArc:";

export const logger = {
  debug(message: string, ...args: any[]): void {
    console.debug(`${LOG_PREFIX} ${message}`, ...args);
  },

  info(message: string, ...args: any[]): void {
    console.log(`${LOG_PREFIX} ${message}`, ...args);
  },

  warn(message: string, ...args: any[]): void {
    console.warn(`${LOG_PREFIX} ${message}`, ...args);
  },

  error(message: string, ...args: any[]): void {
    console.error(`${LOG_PREFIX} ${message}`, ...args);
  },
};

/**
 * Plugin logger that uses PluginAPI.log when available
 * Falls back to console methods otherwise
 */
export function createPluginLogger(pluginAPI?: any) {
  return {
    debug(message: string, ...args: any[]): void {
      if (pluginAPI?.log?.debug) {
        pluginAPI.log.debug(message, ...args);
      } else {
        logger.debug(message, ...args);
      }
    },

    info(message: string, ...args: any[]): void {
      if (pluginAPI?.log?.info) {
        pluginAPI.log.info(message, ...args);
      } else {
        logger.info(message, ...args);
      }
    },

    warn(message: string, ...args: any[]): void {
      if (pluginAPI?.log?.warn) {
        pluginAPI.log.warn(message, ...args);
      } else {
        logger.warn(message, ...args);
      }
    },

    error(message: string, ...args: any[]): void {
      if (pluginAPI?.log?.error) {
        pluginAPI.log.error(message, ...args);
      } else {
        logger.error(message, ...args);
      }
    },
  };
}
