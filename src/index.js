(async() => {
	await require('./setup.js').init();

	const BotClient = require('./Structures/BotClient');
	const config = require('../data/config.json');

	const client = new BotClient(config);
	client.start();
})()
