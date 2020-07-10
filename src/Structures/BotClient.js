const { Client, Collection } = require('discord.js');
const Util = require('./Util.js');
const panel = require('../panel.js');

module.exports = class BotClient extends Client {

	constructor(options = {}) {
		super({
			disableMentions: 'everyone'
		});
		this.validate(options);

		this.commands = new Collection();

		this.events = new Collection();

		this.aliases = new Collection();

		this.utils = new Util(this);

		this.owners = options.owners;

		panel.listen('message', info => {
			if (!info || !('channel' in info) || !('message' in info)) return;
			this.channels.cache.get(info.channel).send(info.message);
		});
	}

	validate(options) {
		if (typeof options !== 'object') throw new TypeError('Options should be a type of Object.');

		if (!options.token) throw new Error('You must pass a token for the client.');
		this.token = options.token;

		if (!options.prefix) throw new Error('You must pass a prefix for the client.');
		if (typeof options.prefix !== 'string') throw new TypeError('Prefix should be a type of String.');
		this.prefix = options.prefix;
	}

	async start(token = this.token) {
		this.utils.loadCommands();
		this.utils.loadEvents();

		try {
			await super.login(token);
		} catch (error) {
			console.error('It seems that the token you provided is invalid.');
			require('../setup.js').again();
		}
	}

};
