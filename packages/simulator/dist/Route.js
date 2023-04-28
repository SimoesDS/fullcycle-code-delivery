"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteById = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const util_1 = require("util");
const asyncReadFile = (0, util_1.promisify)(node_fs_1.default.readFile.bind(node_fs_1.default));
async function loadRoute(routeId) {
    if (!routeId) {
        throw new Error('Route number undefined!');
    }
    try {
        const rawdata = await asyncReadFile(`./destinations/${routeId}.json`);
        const { coordinates } = JSON.parse(rawdata.toString());
        return {
            routeId,
            clientId: '',
            position: coordinates,
            finished: false,
        };
    }
    catch (error) {
        return {
            routeId,
            clientId: '',
            error: error.message,
        };
    }
}
async function getRouteById({ routeId, clientId }) {
    const route = await loadRoute(routeId);
    if (route.error) {
        throw new Error(route.error);
    }
    route.clientId = clientId;
    return route;
}
exports.getRouteById = getRouteById;
