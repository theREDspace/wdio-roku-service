import { ECP, endpoints } from './ecp.js';
import { formatString, waitForAppReady, sleep } from './utils.js';

export enum MediaType {
  SERIES = 'series',
  SEASON = 'season',
  EPISODE = 'episode',
  MOVIE = 'movie',
  SHORT = 'shortFormVideo',
  SPECIAL = 'tvSpecial',
  LIVE = 'live',
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
 * Launches a Roku channel by its ID.
 *
 * @param channelId - The channel ID of the Roku app you want to launch.
 * @returns Promise that resolves to true if the app successfully launches
 * @throws Error if the app fails to launch after retries
 */
export const launchChannel = async (channelId: string): Promise<boolean> => {
  await sleep(500); // Allow any in-progress Roku state transitions to complete, such as calling this function immediately after pressing the Home button.

  const uri = formatString(endpoints.launch, channelId);
  await ECP(uri, 'POST');
  await sleep(1000);

  const ready = await waitForAppReady(3);
  if (!ready) {
    throw new Error(`Failed to launch channel '${channelId}': app did not reach ready state`);
  }

  return true;
};

/**
 * Deeplinks into a Roku channel with specific content.
 *
 * @param channelId - The channel ID of the Roku app.
 * @param contentId - The content ID of the content within the app you want to deeplink to.
 * @param mediaType - The media type of the content you're deeplinking to.
 * @returns Promise that resolves to true if the deeplink successfully launches
 * @throws Error if the deeplink fails after retries
 */
export const deeplink = async (
  channelId: string,
  contentId: string,
  mediaType: string,
): Promise<boolean> => {
  await sleep(500); // Allow any in-progress Roku state transitions to complete, such as calling this function immediately after pressing the Home button.

  const uri = `${formatString(endpoints.launch, channelId)}?contentId=${encodeURIComponent(contentId)}&mediaType=${encodeURIComponent(mediaType)}`;

  await ECP(uri, 'POST');
  await sleep(1000);

  const ready = await waitForAppReady(3);
  if (!ready) {
    throw new Error(`Failed to deeplink to channel '${channelId}' with contentId '${contentId}': app did not reach ready state`);
  }

  return true;
};

/**
 * Sends deeplink parameters to an already-running application.
 *
 * @param contentId - The content ID of the content within the app you want to deeplink to.
 * @param mediaType - The media type of the content you're deeplinking to.
 * @returns The response from the ECP
 */
export const inputDeeplink = (
  contentId: string,
  mediaType: string,
) => {
  return inputChannel({ contentId, mediaType });
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
