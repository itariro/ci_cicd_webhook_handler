const amqplib = require("amqplib");
const amqpUrl =
	process.env.AMQP_URL ||
	"amqps://aonpynev:pMC7iCjQvoomfuPZ3EVhn2OSt_GSi6V3@seal.lmq.cloudamqp.com/aonpynev";

async function publishMessage(configs, payload) {
	const connection = await amqplib.connect(amqpUrl, "heartbeat=60");
	const channel = await connection.createChannel();
	let res = { error: true, message: "An unexpected error occured, try again" };

	try {
		const exchange = configs.exchange;
		const queue = configs.queue;
		const routingKey = configs.routingkey;

		await channel.assertExchange(exchange, "direct", { durable: true });
		await channel.assertQueue(queue, { durable: true });
		await channel.bindQueue(queue, exchange, routingKey);

		const msg = {
			message: payload,
		};

		channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
		res = { error: false, message: "message sent" };
	} catch (e) {
		res = { error: true, message: "error publishing message", e };
	} finally {
		await channel.close();
		await connection.close();
	}
	return res;
}

async function listenForMessages() {
	const connection = await amqplib.connect(amqpUrl, "heartbeat=60");
	const channel = await connection.createChannel();
	channel.prefetch(10);
	const queue = process.env.APP_QUEUE_SIGNATURE;

	process.once("SIGINT", async () => {
		console.log("got sigint, closing connection");
		await channel.close();
		await connection.close();
		process.exit(0);
	});

	await channel.assertQueue(queue, { durable: true });
	await channel.consume(
		queue,
		async (msg) => {
			await processMessage(JSON.parse(msg.content.toString()));
			channel.ack(msg);
		},
		{
			noAck: false,
			//consumerTag: "email_consumer",
		}
	);
	console.log(" [*] Waiting for messages. To exit press CTRL+C");
}

async function processMessage(message) {
	global.process_uuid = message.uuid;
	switch (message.action) {
		case "api_key_refresh":
			global.API_KEY = message.payload.key;
			break;
		case "part_search":
			global.API_KEY = message.payload.key;
			break;
	}
}

module.exports = {
	publishMessage,
	listenForMessages,
};
