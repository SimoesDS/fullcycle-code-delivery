//docker exec -it be bash
//kafka-console-producer --bootstrap-server=localhost:9092 --topic=readtest
// kafka-topics --bootstrap-server=localhost:9092 --delete --topic route.new-position
// kafka-console-consumer --bootstrap-server=localhost:9092 --topic=route.new-position
require('dotenv').config();
import { Kafka, EachMessagePayload, Producer } from 'kafkajs'
import { Route, getRouteById } from './Route'

type RouteOnly = Omit<Route, 'position'> & {
  position: [number, number]
}
type RouteArgs = RouteOnly | { error: string }

async function handleMessage({ message }: EachMessagePayload, sendMessage: (route: RouteArgs) => void): Promise<void> {
  if (!message?.value) return;

  const { value } = message;

  let parsedValue: unknown;
  
  try {
    parsedValue = JSON.parse(value.toString());
  } catch (error) {
    sendMessage({
      error: `"${value.toString()}" precisa ser um JSON!`
    });
    return;
  }

  const { routeId, clientId } = parsedValue as { routeId?: string; clientId?: string };

  if (!routeId) {
    sendMessage({
      error: '"routeId" não informado!'
    });
    return;
  }

  if (!clientId) {
    sendMessage({
      error: '"clientId" não informado!'
    });
    return;
  }

  const route = await getRouteById({ routeId, clientId });

  const timer = setTimeout(() => {
    route.position?.forEach((position) => {
      sendMessage({ ...route, position })
    });

    clearInterval(timer);
  }, 500);
}

async function run() {
  const { KAFKA_CONSUMER_GROUP_ID, KAFKA_READ_TOPIC, KAFKA_PRODUCE_TOPIC } = process.env;

  if (!KAFKA_CONSUMER_GROUP_ID)
    throw new Error('KAFKA_CONSUMER_GROUP_ID is undefined!');
  if (!KAFKA_READ_TOPIC)
    throw new Error('KAFKA_READ_TOPIC is undefined!');
  if (!KAFKA_PRODUCE_TOPIC)
    throw new Error('KAFKA_READ_TOPIC is undefined!');

  const kafka = new Kafka({
    clientId: KAFKA_CONSUMER_GROUP_ID,
    brokers: ['localhost:9092']
  });

  const producer = kafka.producer();
  await producer.connect();

  const consumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP_ID })

  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_READ_TOPIC, fromBeginning: false })

  await consumer.run({
    eachMessage: async (msgSrc) => {
      try {
        await handleMessage(msgSrc, (msgOut: RouteOnly | { error: string }) => {
          producer.send({
            topic: KAFKA_PRODUCE_TOPIC,
            messages: [
              {
                value: JSON.stringify(msgOut)
              }
            ]
          });
        });
      } catch (error: any) { 
        console.error(`Error processing message: ${error.message}`);
      }
    }
  })
}

run().catch(console.error)