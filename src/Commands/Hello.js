/* eslint-disable no-unused-vars */
const Command = require('./../Structures/Command.js');
const panel = require('../panel.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['hallo']
		});
	}

	async run(message, args) {
		message.channel.send('Hello');
		panel.send(this);
	}

};
