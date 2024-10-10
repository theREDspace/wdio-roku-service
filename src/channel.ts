import { ECP, endpoints } from './ecp.js';
import { formatString } from './utils.js';

export const enum MediaType {
  SERIES = 'series',
  SEASON = 'season',
  EPISODE = 'episode',
  MOVIE = 'movie',
  SHORT = 'shortFormVideo',
  SPECIAL = 'tvSpecial',
}

/**
 * Returns the state object for the channel ID specified.
 *
 * @param channelId - The ID of the channel you want to query.
 * @returns The response from the ECP
 */
export const getChannelState = (channelId: string) => {
  const uri = formatString(endpoints.channelState, channelId);
  return ECP(uri, 'POST');
};

/**
 * Launches a Roku channel by its ID. Can be used with optional deeplink parameters.
 *
 * @param channelId - The channel ID of the Roku app you want to install.
 * @param contentId - Optional. The content ID of the content within the app you want to deeplink to.
 * @param mediaType - Optional. The media type of the content you're deeplinking to.
 * @param queryParams - Optional. Additional arguments to send to the app.
 * @returns The response from the ECP
 */
export const launchChannel = (
  channelId: string,
  contentId: string = '',
  mediaType: string = '',
  queryParams?: { [key: string]: string | number | boolean },
) => {
  let uri = formatString(endpoints.launch, channelId, contentId, mediaType);

  if (queryParams) {
    Object.entries(queryParams).forEach((param) => {
      uri = `${uri}&${encodeURIComponent(param[0])}=${encodeURIComponent(param[1])}`;
    });
  }

  return ECP(uri, 'POST');
};

/**
 * Sends custom events to the current application.
 * {@link https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md#input-examples}
 *
 * @param params - An object containing key/value pairs. Will be appended as query params to the ECP request url.
 * @returns The response from the ECP
 */
export const inputChannel = (params: { [key: string]: string | number | boolean }) => {
  let uri = `${endpoints.input}`;
  Object.entries(params).forEach((param) => {
    uri = uri + encodeURIComponent(param[0]) + '=' + encodeURIComponent(param[1]) + '&';
  });
  // Remove final &
  uri = uri.slice(0, -1);
  return ECP(uri, 'POST');
};

/**
 * Close/exit a channel. Requires RokuOS 13.0 or higher.
 * If the channel supports Instant Resume, this will suspend the channel in the background rather than exiting it.
 *
 * @returns The response from the ECP
 */
export const exitChannel = () => {
  return ECP(endpoints.exit, 'GET');
};
