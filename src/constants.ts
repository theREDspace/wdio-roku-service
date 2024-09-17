/**
 * Controller mapping string enum.
 */
export const enum Buttons {
    HOME = "Home",
    UP = "Up",
    DOWN = "Down",
    LEFT = "Left",
    RIGHT = "Right",
    SELECT = "Select",
    REVERSE = "Reverse",
    FORWARD = "Forward",
    PLAY = "Play",
    BACK = "Back",
    INSTANT_REPLAY = "InstantReplay",
    INFO = "Info",
    BACKSPACE = "Backspace",
    SEARCH = "Search",
    ENTER = "Enter",
}

/**
 * All the possible ECP endpoints, use the formatString function to replace the string placeholders when it's time to make a request.
 */
export const endpoints = {
    appUI: "query/app-ui",
    activeApp: "query/active-app",
    apps: "query/apps",
    install: "install/%s",
    launch: "launch/%s?contentId=%s&mediaType=%s",
    icon: "query/icon/%s",
    device: "query/device-info",
    keypress: "keypress/%s",
    keydown: "keydown/%s",
    keyup: "keyup/%s",
    player: "query/media-player",
    input: "input?",
    load: "/plugin_install",
    exit: "exit-app",
    channelState: "query/channel-state/%s",
    sgnodes: "query/sgnodes/all",
    sgnodesroot: "query/sgnodes/roots"
};