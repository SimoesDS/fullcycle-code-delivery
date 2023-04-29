//docker exec -it be bash
// kafka-topics --bootstrap-server=localhost:9092 --delete --topic route.new-position
// kafka-topics --bootstrap-server=localhost:9092 --delete --topic route.new-direction
// kafka-console-consumer --bootstrap-server=localhost:9092 --topic=route.new-position
// kafka-console-producer --bootstrap-server=localhost:9092 --topic=route.new-direction
// { "routeId": "1", "clientId": "1" }
// { "routeId": "2", "clientId": "1" }
// { "routeId": "3", "clientId": "1" }
require('dotenv').config();
import { Kafka, EachMessagePayload } from 'kafkajs'
import { Worker } from 'node:worker_threads'

type SendMessageHandlerArgs = Route | { error: string }
type SendMessageHandler = (route: SendMessageHandlerArgs) => void

export interface RouteIndex {
  routeId: string;
  clientId: string;
}

export interface Route extends RouteIndex {
  position?: [number, number][];
  finished?: boolean;
  error?: string,
}

function createThread(routeIndex: RouteIndex, sendMessage: SendMessageHandler) {
  const worker = new Worker('./dist/thread.js', { workerData: routeIndex })
  worker.on('message', sendMessage);
  worker.on('error', sendMessage);
}

async function handleMessage({ message }: EachMessagePayload, sendMessage: SendMessageHandler): Promise<void> {
  if (!message?.value) return;

  const { value } = message;

  let routeIndex: RouteIndex;
  
  try {
    routeIndex = JSON.parse(value.toString());
  } catch (error) {
    sendMessage({
      error: `"${value.toString()}" precisa ser um JSON!`
    });
    return;
  }

  if (!routeIndex.routeId) {
    sendMessage({
      error: '"routeId" undefined!'
    });
    return;
  }

  if (!routeIndex.clientId) {
    sendMessage({
      error: '"clientId" undefined!'
    });
    return;
  }

  createThread(routeIndex, sendMessage);
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

  await consumer.connect();
  console.log(`Subscribeing on topic ${KAFKA_READ_TOPIC}...`);
  await consumer.subscribe({ topic: KAFKA_READ_TOPIC, fromBeginning: false })

  console.log(`Starting Simulator...`);
  await consumer.run({
    eachMessage: async (msgSrc) => {
      try {
        await handleMessage(msgSrc, (msgOut: SendMessageHandlerArgs) => {
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
  });

  console.log(`Simulador is running!`);
}

run().catch(console.error);