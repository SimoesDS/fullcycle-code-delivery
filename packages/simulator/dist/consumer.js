"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const kafkajs_1 = require("kafkajs");
const node_worker_threads_1 = require("node:worker_threads");
function createThread(routeIndex, sendMessage) {
    const worker = new node_worker_threads_1.Worker('./dist/thread.js');
    worker.on('message', sendMessage);
    worker.on('error', sendMessage);
    worker.postMessage(routeIndex);
}
async function handleMessage({ message }, sendMessage) {
    if (!message?.value)
        return;
    const { value } = message;
    let routeIndex;
    try {
        routeIndex = JSON.parse(value.toString());
    }
    catch (error) {
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
    const kafka = new kafkajs_1.Kafka({
        clientId: KAFKA_CONSUMER_GROUP_ID,
        brokers: ['localhost:9092']
    });
    const producer = kafka.producer();
    await producer.connect();
    const consumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP_ID });
    await consumer.connect();
    console.log(`Subscribeing on topic ${KAFKA_READ_TOPIC}...`);
    await consumer.subscribe({ topic: KAFKA_READ_TOPIC, fromBeginning: false });
    console.log(`Starting Simulator...`);
    await consumer.run({
        eachMessage: async (msgSrc) => {
            try {
                await handleMessage(msgSrc, (msgOut) => {
                    producer.send({
                        topic: KAFKA_PRODUCE_TOPIC,
                        messages: [
                            {
                                value: JSON.stringify(msgOut)
                            }
                        ]
                    });
                });
            }
            catch (error) {
                console.error(`Error processing message: ${error.message}`);
            }
        }
    });
    console.log(`Simulador is running!`);
}
run().catch(console.error);
