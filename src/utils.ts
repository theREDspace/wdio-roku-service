import { ECP } from './ecp';
import { endpoints } from './constants';
import type { Document } from '@xmldom/xmldom';

/**
 * Allows for implicit wait in tests.
 *
 * @param ms - The amount of milliseconds to wait.
 * @returns Promise<unknown>
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * This does the same thing as sprintf in go (automated-channel-testing uses this).
 * @returns string
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
  let status: string | null | undefined;
  while (true) {
    let counter: number = 0;
    const ui = (await ECP(endpoints['appUI'], 'GET')) as Document;
    status = ui.getElementsByTagName('status')[0]?.childNodes[0]?.nodeValue;
    if (status === 'OK') break;
    counter++;
    if (counter < retries) {
      await sleep(5000);
    } else {
      break;
    }
  }
  return status === 'OK' ? true : false;
};
