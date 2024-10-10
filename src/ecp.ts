/**
 * All the possible ECP endpoints, use the formatString function to replace the string placeholders when it's time to make a request.
 */
export const endpoints = {
  appUI: 'query/app-ui',
  activeApp: 'query/active-app',
  apps: 'query/apps',
  channelState: 'query/channel-state/%s',
  device: 'query/device-info',
  exit: 'exit-app',
  frameRate: 'query/graphics-frame-rate',
  icon: 'query/icon/%s',
  input: 'input?',
  install: 'install/%s',
  keydown: 'keydown/%s',
  keypress: 'keypress/%s',
  keyup: 'keyup/%s',
  launch: 'launch/%s?contentId=%s&mediaType=%s',
  load: 'plugin_install',
  performance: 'query/chanperf',
  player: 'query/media-player',
  screenshot: 'plugin_inspect',
  sgnodes: 'query/sgnodes/all',
  sgnodesroot: 'query/sgnodes/roots',
  textureMemory: 'query/r2d2-bitmaps',
};

/**
 * Sends an HTTP request to a Roku device.
 *
 * @param uri - The request uri to send to the device. Use the endpoints object to specify values for this.
 * @param method - The request method to send ("GET", "POST", etc).
 * @param ecp - This determines whether to use port 8060 or not. Default is true.
 * @param body - Optional. The request body to send.
 * @param headers - Optional. The request headers to send.
 * @returns The response from the roku, often an xml body
 */
export const ECP = (
  uri: string,
  method: string,
  ecp: boolean = true,
  body?: string | FormData | undefined,
  headers?: Record<string, string>,
) => {
  const url = ecp ? `http://${process.env.ROKU_IP}:8060` : `http://${process.env.ROKU_IP}`;
  const req: Request = new Request(`${url}/${uri}`);
  const options: RequestInit =
    headers === undefined ? { method: method, body: body } : { method: method, body: body, headers: headers };
  return fetch(req, options);
};
