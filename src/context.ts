/**
 * Worker-scoped context for Roku device configuration.
 * This module stores the Roku connection details for the current test worker,
 * enabling parallel testing across multiple Roku devices.
 */

export interface RokuDeviceConfig {
  /** The IP address of the Roku device */
  ip: string;
  /** The username for authentication (optional, defaults to 'rokudev') */
  user?: string;
  /** The password for authentication (optional, defaults to '1234') */
  password?: string;
}

let currentDevice: RokuDeviceConfig | null = null;

/**
 * Sets the Roku device configuration for the current worker.
 * Called during the service's `before` hook.
 *
 * @param config - The Roku device configuration
 */
export const setRokuDevice = (config: RokuDeviceConfig): void => {
  currentDevice = config;
};

/**
 * Gets the current Roku device's IP address.
 * Falls back to ROKU_IP environment variable for backward compatibility.
 *
 * @returns The IP address of the Roku device
 * @throws Error if no Roku IP is configured
 */
export const getRokuIP = (): string => {
  if (currentDevice?.ip) {
    return currentDevice.ip;
  }
  if (process.env.ROKU_IP) {
    return process.env.ROKU_IP;
  }
  throw new Error('No Roku IP configured. Set roku:deviceIP in capabilities or ROKU_IP environment variable.');
};

/**
 * Gets the current Roku device's username for authentication.
 * Falls back to ROKU_USER environment variable, then to 'rokudev'.
 *
 * @returns The username for Roku authentication
 */
export const getRokuUser = (): string => {
  return currentDevice?.user ?? process.env.ROKU_USER ?? 'rokudev';
};

/**
 * Gets the current Roku device's password for authentication.
 * Falls back to ROKU_PW environment variable, then to '1234'.
 *
 * @returns The password for Roku authentication
 */
export const getRokuPassword = (): string => {
  return currentDevice?.password ?? process.env.ROKU_PW ?? '1234';
};

/**
 * Clears the current Roku device configuration.
 * Called during service cleanup.
 */
export const clearRokuDevice = (): void => {
  currentDevice = null;
};

/**
 * Checks if a Roku device is currently configured.
 *
 * @returns True if a Roku device is configured
 */
export const hasRokuDevice = (): boolean => {
  return currentDevice !== null || !!process.env.ROKU_IP;
};
