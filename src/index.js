(async() => {
	await require('./setup.js').init();

	const BotClient = require('./Structures/BotClient');
	const config = require('../data/config.json');
	const panel = require('./panel.js');

	const client = new BotClient(config, panel);
	client.start();
})()
