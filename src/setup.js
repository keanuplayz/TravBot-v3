// This file is called (or at least should be called) automatically as long as a config file doesn\'t exist yet.
// And that file won\'t be written until the data is successfully initialized.
const fs = require('fs');
const inquirer = require('inquirer');
const prompts = [{
	type: 'input',
	name: 'prefix',
	message: 'What do you want your bot\'s prefix to be?',
	default: '!!'
}, {
	type: 'password',
	name: 'token',
	message: 'What\'s your bot\'s token?',
	mask: true
}, {
	type: 'input',
	name: 'owners',
	message: 'Enter a list of bot owners (by their IDs) separated by spaces.'
}];
const dir = 'data';
const path = `${dir}/config.json`;

module.exports = {
	async init() {
		while (!fs.existsSync(path)) {
			const answers = await inquirer.prompt(prompts);
			answers.owners = answers.owners.split(' ');
			if (!fs.existsSync(dir)) fs.mkdirSync(dir);
			fs.writeFileSync(path, JSON.stringify(answers, null, 4));
		}
	},
	// Prompt the user to set their token again.
	async again() {
		const answers = await inquirer.prompt([{
			type: 'password',
			name: 'token',
			message: 'What\'s your bot\'s token?',
			mask: true
		}]);
		const config = JSON.parse(fs.readFileSync(path));
		config.token = answers.token;
		fs.writeFileSync(path, JSON.stringify(config, null, 4));
	}
};