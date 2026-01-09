import { ECP, endpoints } from './ecp.js';
import { launchChannel } from './channel.js';
import { sleep, formatString, waitForAppReady, getAuthHeaders } from './utils.js';
import * as fs from 'fs';

/**
 * Installs a Roku channel by its ID. Can be used to install without a zip.
 *
 * @param channelId - The channel ID of the Roku app you want to install.
 * @returns Promise that resolves to true if the app successfully installs and launches
 * @throws Error if the installation or launch fails
 */
export const installByID = async (channelId: string): Promise<boolean> => {
  const uri = formatString(endpoints.install, channelId);
  await ECP(uri, 'POST');
  await sleep(1000);
  await launchChannel(channelId); // Throws on failure

  const ready = await waitForAppReady(5);
  if (!ready) {
    throw new Error(`Failed to install channel '${channelId}': app did not reach ready state after installation`);
  }

  return true;
};

/**
 * Sideload a Roku app to a device. This can be later accessed through the channel ID 'dev'
 *
 * @param pathToArchive - The path to the archive containing the Roku app to sideload
 * @returns Promise that resolves to true if the app successfully installs
 * @throws Error if the installation fails
 */
export const installFromZip = async (pathToArchive: string): Promise<boolean> => {
  const headers = await getAuthHeaders(endpoints.load, 'POST');
  if (headers === undefined) {
    throw new Error('Failed to get authentication headers for archive installation');
  }

  const form = new FormData();

  try {
    const stream = fs.createReadStream(pathToArchive);
    const fileName = pathToArchive.split('/')[-1];
    const blob = await createBlobFromStream(stream, fileName);

    form.append('archive', blob, 'name');
    form.append('mysubmit', 'Install');
  } catch (e: unknown) {
    throw new Error(`Failed to read archive file '${pathToArchive}': ${e}`);
  }

  const response: Response = (await ECP(endpoints.load, 'POST', false, form, headers)) as Response;
  if (response.status !== 200) {
    throw new Error(`Failed to install archive: Roku returned status ${response.status}`);
  }

  const ready = await waitForAppReady(5);
  if (!ready) {
    throw new Error('Failed to install archive: app did not reach ready state after installation');
  }

  return true;
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
