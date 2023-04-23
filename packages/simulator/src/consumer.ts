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

async function handleMessage({ topic, partition, message }: EachMessagePayload, sendMessage: (route: RouteArgs) => void): Promise<void> {
  if (!message || !message.value)
    return;

  let value;
  
  try {
    value = JSON.parse(message.value.toString());
  } catch (error) {
    sendMessage({
      error: `"${message.value.toString()}" precisa ser um JSON!`
    })
    return;
  }

  if (!value.routeId) {
    sendMessage({
      error: '"routeId" não informado!'
    })
    return;
  }

  if (!value.clientId) {
    sendMessage({
      error: '"clientId" não informado!'
    })
    return;
  }



  const route = await getRouteById(value);

  const timer = setTimeout(() => {
    route.position?.forEach((position) => {
      sendMessage({ ...route, position })

    })
  }, 500);

}

async function run() {
  if (!process.env.KAFKA_CONSUMER_GROUP_ID)
    throw new Error('KAFKA_CONSUMER_GROUP_ID is undefined!')
  if (!process.env.KAFKA_READ_TOPIC)
    throw new Error('KAFKA_READ_TOPIC is undefined!')

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CONSUMER_GROUP_ID,
    brokers: ['localhost:9092']
  });

  const producer = kafka.producer();
  await producer.connect();

  const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP_ID })

  await consumer.connect()
  await consumer.subscribe({ topic: process.env.KAFKA_READ_TOPIC, fromBeginning: false })

  await consumer.run({
    eachMessage: async (msgSrc) =>
      await handleMessage(msgSrc, (msgOut: RouteOnly | { error: string }) => {
        producer.send({
          topic: process.env.KAFKA_PRODUCE_TOPIC || '',
          messages: [
            {
              value: JSON.stringify(msgOut)
            }
          ]
        })
      })
  })
}

run().catch(console.error)