import RokuWorkerService from './service';

export default RokuWorkerService;

declare global {
  namespace WebdriverIO {
    interface Browser {
      /**
       * Downloads the XML of the current UI from the Roku, writes it to a temporary file, then opens that in the browser.
       * This will not automatically update, you must call this any time there are changes.
       * @returns The result from browser.url()
       */
      openRokuXML: () => Promise<void | WebdriverIO.Request>;
    }
  }
  namespace NodeJS {
    interface ProcessEnv {
      /** The IP address of the Roku to communicate with. */
      ROKU_IP: string;
      /** The ID of the channel to test. */
      ROKU_CHANNEL_ID?: string;
      /** The location of the zipped archive to install. */
      ROKU_APP_PATH?: string;
      /** The username to authenticate with for installing or taking screenshots. */
      ROKU_USER?: string;
      /** The password to authenticate with for installing or taking screenshots. */
      ROKU_PW?: string;
    }
  }
}
