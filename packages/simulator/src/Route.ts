//https://www.mapmyrun.com/

import fs from 'node:fs';
import { promisify } from 'util';

const asyncReadFile = promisify(fs.readFile.bind(fs));

export interface RouteIndex {
  routeId: string;
  clientId: string;
}

export interface Route extends RouteIndex {
  position?: [number, number][];
  finished?: boolean;
  error?: string,
}

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

export async function getRouteById({ routeId, clientId }: { routeId: string; clientId: string }): Promise<Route> {
  const route = await loadRoute(routeId);

  if (route.error) {
    throw new Error(route.error);
  }

  route.clientId = clientId;

  return route;
}