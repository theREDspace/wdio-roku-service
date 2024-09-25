import RokuWorkerService from './service';

export default RokuWorkerService;

declare global {
  namespace WebdriverIO {
    interface Browser {
      openRokuXML: () => Promise<void | WebdriverIO.Request>;
    }
  }
  namespace NodeJS {
    interface ProcessEnv {
      ROKU_IP: string;
      ROKU_CHANNEL_ID?: string;
      ROKU_APP_PATH?: string;
      ROKU_USER?: string;
      ROKU_PW?: string;
    }
  }
}
