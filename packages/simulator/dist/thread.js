"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_worker_threads_1 = require("node:worker_threads");
const Route_1 = require("./Route");
console.log(`Thread ${node_worker_threads_1.threadId}: Created successuful`);
node_worker_threads_1.parentPort?.once('message', async (routeIndex) => {
    console.log(`Thread ${node_worker_threads_1.threadId}: Created with parameters ${routeIndex}`);
    const route = await (0, Route_1.getRouteById)(routeIndex);
    if (route.position) {
        const message = { ...route, position: route.position[0], finished: 0 == route.position.length - 1 };
        node_worker_threads_1.parentPort?.postMessage(message);
        console.log(`Thread ${node_worker_threads_1.threadId}: Posted ${JSON.stringify(message)}`);
    }
});
