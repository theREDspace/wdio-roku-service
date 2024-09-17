import { ECP } from './ecp';
import { endpoints } from './constants';
import { sleep, formatString } from './utils';

/**
 * Sends a key down command to the Roku.
 *
 * @param key - The controller button to hold.
 * @returns Whether the input succeeded.
 */
export const keyDown = async (key: string) => {
  const uri: string = formatString(endpoints['keydown'], key);
  return ECP(uri, 'POST');
};

/**
 * Sends a key up command to the Roku.
 *
 * @param key - The controller button to release.
 * @returns Whether the input succeeded.
 */
export const keyUp = async (key: string) => {
  const uri: string = formatString(endpoints['keyup'], key);
  return ECP(uri, 'POST');
};

/**
 * Sends a key press command to the Roku.
 *
 * @param key - The controller button to press (key down then key up).
 * @returns Whether the input succeeded.
 */
export const keyPress = async (key: string) => {
  const uri: string = formatString(endpoints['keypress'], key);
  return ECP(uri, 'POST');
};

/**
 * Sends a sequence of key press commands to the Roku.
 *
 * @param keys - An array of keys to press in sequence.
 * @returns Whether every input succeeded.
 */
export const keySequence = async (keys: string[]): Promise<boolean> => {
  for (const key of keys) {
    try {
      await keyPress(key);
      await sleep(500);
    } catch {
      return false;
    }
  }
  return true;
};

/**
 * Converts a string into keyboard presses and sends them to the Roku.
 * Use keyPress(Buttons.Enter) to complete the entry field.
 *
 * @param inputString The string to enter using the keyboard
 * @returns Whether all the keypresses succeeded.
 */
export const keyboardInput = (inputString: string): Promise<boolean> => {
  const chars = inputString.split('');
  const keys: string[] = chars.map((char) => `Lit_${encodeURIComponent(char)}`);
  return keySequence(keys);
};
