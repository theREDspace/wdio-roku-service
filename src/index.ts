import * as _controller from "./controller";
import * as _constants from "./constants";
import * as _channel from "./channel";
import * as _install from "./install";
import * as _info from "./info";
import RokuWorkerService from "./service";

export default RokuWorkerService;
/**
 * Contains constant expressions for Roku
 */
export const constants = _constants;
/**
 * Contains ECP commands related to the remote control for Roku
 */
export const controller = _controller;
/**
 * Contains ECP commands related to installing apps on Roku
 */
export const install = _install;
/**
 * Contains ECP commands related to channels on Roku
 */
export const channel = _channel;
/**
 * Contains miscellaneous ECP commands to get various information from the Roku
 */
export const info = _info;