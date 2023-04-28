import {
  threadId,
  parentPort
} from 'node:worker_threads';
import { RouteIndex, getRouteById } from './Route';

console.log(`Thread ${threadId}: Created successuful`)
parentPort?.once('message', async (routeIndex: RouteIndex) => {
  console.log(`Thread ${threadId}: Created with parameters ${routeIndex}`)
  const route = await getRouteById(routeIndex);
  
   if(route.position) {
    // for (let i = 0; i < route.position.length; i++) {
      const message = { ...route, position: route.position[0], finished: 0 == route.position.length - 1 };
      parentPort?.postMessage(message)
      console.log(`Thread ${threadId}: Posted ${JSON.stringify(message)}`)
      // await new Promise(resolve => setTimeout(resolve, 200));
    // }
  // else parentPort?.postMessage({
  //   error: `Route "${JSON.stringify(routeIndex)}" not founded!`
  // });
   }
});