import { ECP, endpoints } from './ecp';
import { formatString } from './utils';
import type { Document } from '@xmldom/xmldom';

/**
 * Returns the state object for the channel ID specified.
 *
 * @param channelId - The ID of the channel you want to query.
 * @returns The response from the ECP
 */
export const getChannelState = (channelId: string) => {
  const uri = formatString(endpoints['channelState'], channelId);
  return ECP(uri, 'POST');
};

/**
 * Launches a Roku channel by its ID. Can be used with optional deeplink parameters.
 *
 * @param channelId - The channel ID of the Roku app you want to install.
 * @param contentId - Optional. The content ID of the content within the app you want to deeplink to.
 * @param mediaType - Optional. The media type of the content you're deeplinking to.
 * @returns The response from the ECP
 */
export const launchChannel = (
  channelId: string,
  contentId: string = '',
  mediaType: string = '',
): Promise<Response | Document> => {
  const uri = formatString(endpoints['launch'], channelId, contentId, mediaType);
  return ECP(uri, 'POST');
};

/**
 * Sends custom events to the current application.
 *
 * @param params - An object containing key/value pairs. Will be appended as query params to the ECP request url.
 * @returns The response from the ECP
 */
export const inputChannel = (params: object): Promise<Response | Document> => {
  let uri = `${endpoints['input']}`;
  Object.entries(params).forEach((param) => {
    uri = uri + param[0] + '=' + param[1] + '&';
  });
  uri = uri.slice(0, -1);
  return ECP(uri, 'POST');
};

/**
 * Close/exit a channel. Channel must support Instant Resume to use this and the device must be running at least RokuOS 13.0.
 *
 * @returns The response from the ECP
 */
export const exitChannel = (): Promise<Response | Document> => {
  return ECP(endpoints['exit'], 'GET');
};
