import {
  threadId,
  parentPort,
  workerData
} from 'node:worker_threads';
import fs from 'node:fs';
import { promisify } from 'util';
import { Route, RouteIndex } from './consumer';

const asyncReadFile = promisify(fs.readFile.bind(fs));

async function loadRoute(routeId: string): Promise<Route> {
  if (!routeId) {
    throw new Error('Route number undefined!');
  }

  try {
    const rawdata = await asyncReadFile(`./destinations/${routeId}.json`);
    const { coordinates } = JSON.parse(rawdata.toString()) as { coordinates: [number, number][] };

    return {
      routeId,
      clientId: '',
      position: coordinates,
      finished: false,
    };
  } catch (error: any) {
    return {
      routeId,
      clientId: '',
      error: error.message,
    };
  }
}

export async function getRouteById({ routeId, clientId }: RouteIndex) {
  const route = await loadRoute(routeId);

  if (route.error)
    throw new Error(route.error);

  return { ...route, clientId };
}

async function run() {
  try {
    console.log(`Thread ${threadId}: Created with parameters ${JSON.stringify(workerData)}`)
    const route = await getRouteById(workerData);

    if (route.position) {
      for (const position of route.position) {
        const message = { ...route, position, finished: position === route.position[route.position.length - 1] };
        parentPort?.postMessage(message)
        console.log(`Thread ${threadId}: Posted ${JSON.stringify(message)}`)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      parentPort?.postMessage({
        error: `Thread ${threadId}: Route "${JSON.stringify(workerData)}" not found!`
      });
    }
  } catch (error: any) {
    parentPort?.postMessage({
      error: `Thread ${threadId}: Error: ${error.message}`
    });
  }
}

run().catch(console.error);