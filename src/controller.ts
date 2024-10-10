import { ECP, endpoints } from './ecp.js';
import { sleep, formatString } from './utils.js';

/**
 * Controller mapping string enum.
 */
export enum Buttons {
  HOME = 'Home',
  UP = 'Up',
  DOWN = 'Down',
  LEFT = 'Left',
  RIGHT = 'Right',
  SELECT = 'Select',
  REVERSE = 'Reverse',
  FORWARD = 'Forward',
  PLAY = 'Play',
  BACK = 'Back',
  INSTANT_REPLAY = 'InstantReplay',
  INFO = 'Info',
  BACKSPACE = 'Backspace',
  SEARCH = 'Search',
  /** Used to finalize input fields. */
  ENTER = 'Enter',
}

/**
 * Sends a key down command to the Roku.
 *
 * @param key - The controller button to hold.
 * @returns The response from the ECP (if successful, the response body will be empty)
 */
export const keyDown = async (key: string) => {
  const uri = formatString(endpoints.keydown, key);
  return ECP(uri, 'POST');
};

/**
 * Sends a key up command to the Roku.
 *
 * @param key - The controller button to release.
 * @returns The response from the ECP (if successful, the response body will be empty)
 */
export const keyUp = async (key: string) => {
  const uri = formatString(endpoints.keyup, key);
  return ECP(uri, 'POST');
};

/**
 * Sends a key press command to the Roku.
 *
 * @param key - The controller button to press (key down then key up).
 * @returns The response from the ECP (if successful, the response body will be empty)
 */
export const keyPress = async (key: string) => {
  const uri = formatString(endpoints.keypress, key);
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
      const response = await keyPress(key);
      if (!response.ok) return false;
      await sleep(100);
    } catch {
      return false;
    }
  }
  return true;
};

/**
 * Converts a string into keyboard presses and sends them to the Roku.
 * Use keyPress(Buttons.ENTER) to complete the entry field.
 *
 * @param inputString The string to enter using the keyboard
 * @returns Whether all the keypresses succeeded.
 */
export const keyboardInput = (inputString: string): Promise<boolean> => {
  const chars = inputString.split('');
  const keys = chars.map((char) => `Lit_${encodeURIComponent(char)}`);
  return keySequence(keys);
};
