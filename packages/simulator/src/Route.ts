//https://www.mapmyrun.com/

import fs from 'node:fs';
import { promisify } from 'util';

const asyncReadFile = promisify(fs.readFile.bind(fs));



interface Route {
  routeId: string;
  clientId:   string;
  position: [number, number];
  finished: boolean;
}

async function loadPositions(routeId: string): Promise<[number, number]> {
  if(!routeId)
    throw new Error('Route number undefined!');

  const rawdata: any = await asyncReadFile(`./destinations/${routeId}.json`);
  const { coordinates } = JSON.parse(rawdata) as { coordinates: [number, number][] };

  
  return coordinates[0];
}

export async function getRouteById({ routeId, clientId }: { routeId: string, clientId: string }): Promise<Route> {
  const position = await loadPositions(routeId);

  const route: Route = {
    routeId,
    clientId,
    position,
    finished: false
  }

  console.log(route);

  return route;
}
