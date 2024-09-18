import { formatString } from './utils';
import { ECP, endpoints } from './ecp';

/**
 * Returns the app icon for the channel ID specified.
 *
 * @param channelId - The ID of the channel you want to query.
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getAppIcon = (channelId: string) => {
  const uri = formatString(endpoints['icon'], channelId);
  // TODO: Decode the image and return it to mimic automated-channel-testing.
  return ECP(uri, 'GET');
};

/**
 * Returns the device info object for your current device.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getDeviceInfo = () => {
  return ECP(endpoints['device'], 'GET');
};

/**
 * Returns the player info object for your current device.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getPlayer = () => {
  return ECP(endpoints['player'], 'GET');
};

/**
 * Returns the app UI object for your current device.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getAppUI = () => {
  return ECP(endpoints['appUI'], 'GET');
};

/**
 * Returns the active app object for your current device.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getActiveApp = () => {
  return ECP(endpoints['activeApp'], 'GET');
};

/**
 * Returns the installed apps object for your current device.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getApps = () => {
  return ECP(endpoints['apps'], 'GET');
};

/**
 * Returns the All Nodes object from the SceneGraph Nodes endpoint.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getSGNodes = async () => {
  return ECP(endpoints['sgnodes'], 'GET');
};

/**
 * Returns orphaned SceneGraph Nodes.
 *
 * @returns Promise<any> TODO: return better types for ECP
 */
export const getSGOrphans = async () => {
  return ECP(endpoints['sgnodesroot'], 'GET');
};
