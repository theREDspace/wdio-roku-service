## Requirements
### WDIO Config
Currently, testing is only supported for a single Roku device. The following are required:
* `maxInstances` and `maxInstancesPerCapability` should be 1. Testing on multiple devices automatically isn't supported.
* There should only be a single capability. A headless Chromium build is recommended. For example:
```js
capabilities: [{
    maxInstances: 1,
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: ['--headless', '--disable-gpu']
    }
}],
```
* Import the `RokuWorkerService` and include it in the `services` of your config. No parameters are required.

### .env
See the .env.example file. Copy it and rename it to .env within your project. You will probably want to put it in your .gitignore as well.

* ROKU_IP should be the IP of your Roku. The commands will use this IP to communicate with it. This is required.

Then, there are two options for installation. The service will do the installation automatically before the tests.

Channel Installation

* ROKU_CHANNEL_ID: Put the channel ID of your Roku here and it will be installed using that. If you're installing with a zip, you can set this to 'dev'.

Archive Installation

* ROKU_APP_PATH: This should be the path to the archive of your Roku app.
* ROKU_USER and ROKU_PW: Login credentials are needed to install an archive, as well as for taking screenshots.

You can leave both blank if you wish to install the app yourself instead.

## Usage
`wdio-roku-service/controller` provides the ability to send button presses to the Roku. `keySequence` is the main one, sending several button presses in sequence.
```js
import { Buttons, keySequence } from "wdio-roku-service/controller";

// Navigate through the app
await keySequence(Buttons.LEFT, Buttons.LEFT, Buttons.SELECT, Buttons.DOWN, Buttons.SELECT);
// Fetch the current app UI from the Roku and load it into the browser
await browser.openRokuXML();
// use WDIO functionality on the roku XML as if it was a webpage
```
`wdio-roku-service/controller` also has functions for holding or releasing buttons as well as typing text into a keyboard.
```js
import { Buttons, keyboardInput, keyPress, keySequence } from "wdio-roku-service/controller";

await keySequence(Buttons.DOWN, Buttons.DOWN, Buttons.SELECT);
await keyboardInput("example");
await keyPress(Buttons.ENTER);
await browser.openRokuXML();
```

### Deeplinking
```js
import { exitChannel, launchChannel, MediaType } from "wdio-roku-service/channel";
await exitChannel();
await launchChannel(process.env.ROKU_CHANNEL_ID, myContent, MediaType.MOVIE);
```

### Other Functions
* `wdio-roku-service/channel` provides channel-related functionality. `inputChannel` allows you to send arbitrary information to your app.
* `wdio-roku-service/info` provides miscellaneous functionality, such as getting the app icon or orphaned nodes.
* `wdio-roku-service/install` provides install-related functionality if you want to do it manually.
* `wdio-roku-service/ecp` is the direct interface with the ECP if you need to do anything highly specific.