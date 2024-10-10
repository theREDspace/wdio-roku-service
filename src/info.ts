import { formatString, getAuthHeaders } from './utils.js';
import { ECP, endpoints } from './ecp.js';

/**
 * Returns the app icon for the specified channel ID.
 *
 * @param channelId - The ID of the channel you want to query.
 * @returns The response from the ECP, which if successful, should be the binary data of the image, with the MIME type in the headers
 */
export const getAppIcon = (channelId: string) => {
  const uri = formatString(endpoints.icon, channelId);
  // TODO: Decode the image and return it to mimic automated-channel-testing.
  return ECP(uri, 'GET');
};

/**
 * Returns the device info object for your current device.
 *
 * @returns The response from the ECP: {@link https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md#querydevice-info-example}
 */
export const getDeviceInfo = () => {
  return ECP(endpoints.device, 'GET');
};

/**
 * Returns the player info object for your current device.
 *
 * @returns The response from the ECP: {@link https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md#querymedia-player-example}
 */
export const getPlayer = () => {
  return ECP(endpoints.player, 'GET');
};

/**
 * Returns the app UI object for your current device.
 *
 * @returns The response from the ECP, which if successful, should contain the current UI in XML form
 */
export const getAppUI = () => {
  return ECP(endpoints.appUI, 'GET');
};

/**
 * Returns the active app object for your current device.
 *
 * @returns The response from the ECP: {@link https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md#querytv-active-channel-example}
 */
export const getActiveApp = () => {
  return ECP(endpoints.activeApp, 'GET');
};

/**
 * Returns the installed apps object for your current device.
 *
 * @returns The response from the ECP: {@link https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md#querytv-channels-example}
 */
export const getApps = () => {
  return ECP(endpoints.apps, 'GET');
};

/**
 * Returns the All Nodes object from the SceneGraph Nodes endpoint.
 *
 * @returns The response from the ECP: {@link https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md#query-debugging-examples}
 */
export const getSGNodes = () => {
  return ECP(endpoints.sgnodes, 'GET');
};

/**
 * Returns orphaned SceneGraph Nodes.
 *
 * @returns The response from the ECP, which if successful, should be a list of every node without a parent
 */
export const getSGOrphans = () => {
  return ECP(endpoints.sgnodesroot, 'GET');
};

/**
 * Take a screenshot of the Roku's screen
 * @returns The response from the ECP, which should contain the image in jpg formatting.
 */
export const getScreenshot = async (): Promise<Response> => {
  const headers = await getAuthHeaders(endpoints.screenshot, 'POST');
  if (headers === undefined) throw new Error('getAuthHeaders failed!');

  const form = new FormData();
  form.append('mysubmit', 'Screenshot');

  // Tell the roku to take a screenshot
  const response = await ECP(endpoints.screenshot, 'POST', false, form, headers);
  if (response.status !== 200) throw new Error('ECP call failed taking screenshot!');

  // Get the screenshot from the roku
  const screenshotHeaders = await getAuthHeaders('pkgs/dev.jpg', 'GET');
  if (screenshotHeaders === undefined) throw new Error('getAuthHeaders failed!');

  const screenshotResponse = await ECP('pkgs/dev.jpg', 'GET', false, undefined, screenshotHeaders);
  if (screenshotResponse.status !== 200) throw new Error('ECP call failed getting screenshot!');

  return screenshotResponse;
};
