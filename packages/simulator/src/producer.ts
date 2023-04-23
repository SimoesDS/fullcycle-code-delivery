import { Kafka } from 'kafkajs'
import { getRouteById } from './Route'



async function run() {
    const kafka = new Kafka({
        clientId: 'api',
        brokers: ['localhost:9092']
    })
    const producer = kafka.producer();
    
    await producer.connect();

    const route = await getRouteById({ routeId: '1', clientId: 'A' });

    const message = {

    }
    // setTimeout(async () => {
        await producer.send({
            topic: 'test',
            messages: [
                {
                    value: 'Fazendo teste de publicação'
                }
            ]
        })
    // }, 500)

}

run().catch(console.error)