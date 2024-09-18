import { ECP, endpoints } from './ecp';
import { launchChannel } from './channel';
import { sleep, formatString, waitForAppReady } from './utils';
import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';

/**
 * Installs a Roku channel by its ID. Can use to install without a zip.
 *
 * @param channelId - The channel ID of the Roku app you want to install.
 * @returns Whether the app is now ready for use
 */
export const installByID = async (channelId: string): Promise<boolean> => {
  try {
    const uri = formatString(endpoints['install'], channelId);
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
 * Sideload a Roku app to a device.
 *
 * @returns A promise containing a boolean. Indicates whether a sideload has completed successfully or not.
 */
export const installFromZip = async (pathToArchive: string): Promise<boolean> => {
  const headers = await getAuthHeaders(endpoints['load'], 'POST');
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

  const response: Response = (await ECP(endpoints['load'], 'POST', false, form, headers)) as Response;
  if (response.status !== 200) return false;
  // If the app hasn't loaded after 20 seconds, it probably isn't going to.
  return await waitForAppReady(5);
};

/**
 * Returns a promise containing a record with the authentication headers we need to login to a Roku via its REST APIs.
 *
 * @param uri - The Roku ECP uri we're authenticating with.
 * @param method - The request method. Generally, "POST".
 * @returns Promise<Record<string, string>
 */
const getAuthHeaders = async (uri: string, method: string): Promise<Record<string, string> | undefined> => {
  const auth = await createDigest(uri, method);
  if (!auth) throw Error('Could not get Authorization header from Roku!');
  const formData = new FormData();

  formData.append('mysubmit', 'Delete');
  formData.append('archive', '');

  const headers: Record<string, string> = {
    'Authorization': auth,
    'Content-Type': 'application/json',
  };
  const response: Response = (await ECP(uri, method, false, formData, headers)) as Response;
  if (response.status !== 200) return undefined;
  return headers;
};

/**
 * Create an HTTP digest for authentication.
 * Returns a string representation of the digest.
 *
 * @param uri - The Roku ECP URI for the path we need to authenticate with.
 * @param method - The request method to use, usually "POST".
 * @returns string
 */
const createDigest = async (uri: string, method: string) => {
  try {
    const response = await ECP(uri, method, false);
    const digest = digestParts(response as Response);
    digest.set('uri', uri);
    digest.set('method', method);
    digest.set('username', process.env.ROKU_USER ?? 'rokudev');
    digest.set('password', process.env.ROKU_PW ?? '1234');
    return getDigestAuth(digest);
  } catch (error: unknown) {
    console.error('Error fetching from Roku:', error);
  }
};

/**
 * Returns a map containing the digest items.
 *
 * @param response - A Fetch response object.
 * @returns Map<string,string>
 */
const digestParts = (response: Response) => {
  const result = new Map<string, string>();
  const auth = response.headers.get('WWW-Authenticate');

  if (auth && auth.length > 0) {
    const wantedHeaders = ['nonce', 'realm', 'qop'];
    const responseHeaders = auth.split(',');

    responseHeaders.forEach((header) => {
      wantedHeaders.forEach((wantedHeader) => {
        if (header.includes(wantedHeader)) {
          result.set(wantedHeader, header.split('"')[1]);
        }
      });
    });
  }

  return result;
};

/**
 * Returns an md5 hashed string of the input.
 *
 * @param input - A string to hash, used for HTTP digest authentication.
 * @returns string
 */
const getMD5 = (input: string) => {
  return createHash('md5').update(input).digest('hex');
};

/**
 * Returns a string containing a random number, used for HTTP digest authentication.
 *
 * @returns string
 */
const getCnonce = () => {
  return randomBytes(8).toString('hex').slice(0, 16);
};

/**
 * Returns a string containing the entire HTTP authentication digest using hashed values.
 *
 * @param digest - A map containing the digest values to be hashed.
 * @returns string
 */
const getDigestAuth = (digest: Map<string, string>) => {
  const hash1 = getMD5(digest.get('username') + ':' + digest.get('realm') + ':' + digest.get('password'));
  const hash2 = getMD5(digest.get('method') + ':' + digest.get('uri'));

  const nonceCount = '00000001';
  const cnonce = getCnonce();

  const response = getMD5(`${hash1}:${digest.get('nonce')}:${nonceCount}:${cnonce}:${digest.get('qop')}:${hash2}`);
  return `Digest username="${digest.get('username')}", realm="${digest.get(
    'realm',
  )}", nonce="${digest.get('nonce')}", uri="${digest.get(
    'uri',
  )}", cnonce="${cnonce}", nc=${nonceCount}, qop="${digest.get('qop')}", response="${response}"`;
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
