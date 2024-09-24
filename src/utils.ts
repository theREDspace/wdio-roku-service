import { ECP, endpoints } from './ecp';
import { createHash, randomBytes } from 'crypto';

/**
 * Allows for implicit wait in tests.
 *
 * @param ms - The amount of milliseconds to wait.
 * @returns Promise that resolves after the time elapses
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Replaces the instances of %s in the given string with the provided arguments.
 * If there are more %s than arguments, the latter ones will be removed.
 *
 * @param template The string to replace placeholders within
 * @param args The strings to replace the placeholders with
 * @returns The formatted string
 */
export const formatString = (template: string, ...args: string[]): string => {
  return template.replace(/%s/g, () => args.shift() || '');
};

/**
 * Wait for an app to be ready. Indicated by status "OK", otherwise will be "FAILED".
 *
 * @returns Whether the app is now ready
 */
export const waitForAppReady = async (retries: number): Promise<boolean> => {
  while (true) {
    let counter: number = 0;
    const response = await ECP(endpoints.appUI, 'GET');
    const ui = await response.text();
    if (ui.indexOf('<status>FAILED</status>') < 0) return true;
    counter++;
    if (counter < retries) {
      await sleep(5000);
    } else {
      break;
    }
  }
  return false;
};

/**
 * Returns a promise containing a record with the authentication headers we need to login to a Roku via its REST APIs.
 *
 * @param uri - The Roku ECP uri we're authenticating with.
 * @param method - The request method. Generally, "POST".
 * @returns Promise<Record<string, string>
 */
export const getAuthHeaders = async (uri: string, method: string): Promise<Record<string, string> | undefined> => {
  const auth = await createDigest(uri, method);
  if (!auth) throw Error('Could not get Authorization header from Roku!');
  const formData = new FormData();

  formData.append('mysubmit', 'Delete');
  formData.append('archive', '');

  const headers: Record<string, string> = {
    'Authorization': auth,
    'Content-Type': 'application/json',
  };
  const response = await ECP(uri, method, false, formData, headers);
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
    const digest = digestParts(response);
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
