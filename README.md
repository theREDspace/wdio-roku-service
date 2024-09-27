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
* It's recommended to increase the `waitforInterval` and `waitforTimeout`, as each interval involves downloading the xml from the Roku.

### .env
See the .env.example file. Copy it and rename it to .env within your project. You will probably want to put it in your .gitignore as well.

* ROKU_IP should be the IP of your Roku. The commands will use this IP to communicate with it. This is required.
* ROKU_USER and ROKU_PW: Login credentials are needed to install an archive, as well as for taking screenshots.

## Usage
### Installing
Channel Installation
This requires your channel to have an assigned ID.
```js
import { installByID } from 'wdio-roku-service/install';

async before() {
    await installByID(process.env.ROKU_CHANNEL_ID);
}
```

Archive Installation
```js
import { installFromZip } from 'wdio-roku-service/install';

async before() {
    await installFromZip(process.env.ROKU_ARCHIVE_PATH);
}
```

Pre-Installed Channel
```js
import { launchChannel, exitChannel } from 'wdio-roku-service/channel';

async before() {
    // Close the channel if it's already open. If the channel supports instant resume, this will merely background it
    await exitChannel();
    await launchChannel(process.env.ROKU_CHANNEL_ID);
}
```

### Testing
`wdio-roku-service/controller` provides the ability to send button presses to the Roku. `keySequence` is the main one, sending several button presses in sequence.
```js
import { Buttons, keySequence } from 'wdio-roku-service/controller';

// Navigate through the app
await keySequence(Buttons.LEFT, Buttons.LEFT, Buttons.SELECT, Buttons.DOWN, Buttons.SELECT);
// Fetch the current app UI from the Roku and load it into the browser
await browser.openRokuXML();
// Or, use waits, which will repeatedly load the XML until it times out or the condition passes
await browser.waitUntil(condition);
await element.waitForDisplayed();
// use WDIO matchers on the roku XML as if it was a webpage
expect(element).toHaveAttr('focused');
```

`wdio-roku-service/controller` also has functions for holding or releasing buttons as well as typing text into a keyboard.
```js
import { Buttons, keyboardInput, keyPress, keySequence } from 'wdio-roku-service/controller';

await keySequence(Buttons.DOWN, Buttons.DOWN, Buttons.SELECT);
await keyboardInput('example');
await keyPress(Buttons.ENTER);
await browser.openRokuXML();
```

### Deeplinking
`wdio-roku-service/channel` provides channel-related functionality. `inputChannel` allows you to send arbitrary information to your app.
```js
import { exitChannel, launchChannel, MediaType } from 'wdio-roku-service/channel';
await exitChannel();
await launchChannel(process.env.ROKU_CHANNEL_ID, myContent, MediaType.MOVIE, {myExtraParameter:true});
```

### Other Functions
* `wdio-roku-service/info` provides miscellaneous functionality, such as getting the app icon or orphaned nodes.
```js
import { getAppIcon } from 'wdio-roku-service/info';
const response = await getAppIcon(process.env.ROKU_CHANNEL_ID);
console.log(response.headers.get('Content-Type'));
```
* `wdio-roku-service/ecp` is the direct interface with the ECP if you need to do anything highly specific.
```js
import { ECP } from 'wdio-roku-service/ecp';
await ECP('search/browse?keyword=voyage&type=movie&tmsid=MV000058030000', 'POST');
```