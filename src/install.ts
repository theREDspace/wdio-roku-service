import { ECP, endpoints } from './ecp.js';
import { launchChannel } from './channel.js';
import { sleep, formatString, waitForAppReady, getAuthHeaders } from './utils.js';
import * as fs from 'fs';

/**
 * Installs a Roku channel by its ID. Can be used to install without a zip.
 *
 * @param channelId - The channel ID of the Roku app you want to install.
 * @returns Whether the app is now ready for use
 */
export const installByID = async (channelId: string): Promise<boolean> => {
  try {
    const uri = formatString(endpoints.install, channelId);
    await ECP(uri, 'POST');
    await sleep(1000);
    await launchChannel(channelId);
    return waitForAppReady(5);
  } catch (error) {
    console.error('Error fetching from Roku:', error);
    return false;
  }
};

/**
 * Sideload a Roku app to a device. This can be later accessed through the channel ID 'dev'
 *
 * @param pathToArchive - The path to the archive containing the Roku app to sideload
 * @returns Whether the app is now ready to use.
 */
export const installFromZip = async (pathToArchive: string): Promise<boolean> => {
  const headers = await getAuthHeaders(endpoints.load, 'POST');
  if (headers === undefined) return false;

  const form = new FormData();

  try {
    const stream = fs.createReadStream(pathToArchive);
    const fileName = pathToArchive.split('/')[-1];
    const blob = await createBlobFromStream(stream, fileName);

    form.append('archive', blob, 'name');
    form.append('mysubmit', 'Install');
  } catch (e: unknown) {
    console.error(e);
    return false;
  }

  const response: Response = (await ECP(endpoints.load, 'POST', false, form, headers)) as Response;
  if (response.status !== 200) return false;
  // If the app hasn't loaded after 20 seconds, it probably isn't going to.
  return await waitForAppReady(5);
};

/**
 * Returns a promise containing a Blob object, streamed from a local file.
 *
 * @param stream - ReadStream containing the file to convert.
 * @param filename - The absolute path to the file on your system.
 * @param contentType - The MIME type of the blob, default is application/octet-stream.
 * @returns Promise<Blob>
 */
const createBlobFromStream = (
  stream: fs.ReadStream,
  filename: string,
  contentType = 'application/octet-stream',
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      const blob = new Blob(chunks, { type: contentType });
      (blob as any).lastModifiedDate = new Date();
      (blob as any).name = filename;
      resolve(blob);
    });
    stream.on('error', reject);
  });
};
