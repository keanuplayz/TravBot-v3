const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { Collection } = require('discord.js');
const listeners = new Collection();

io.on('connection', socket => {
	for (const [id, callback] of listeners) socket.on(id, callback);
});

app.use(express.static('panel'));

http.listen(80, () => {
	console.log("Web panel ready!");
});

module.exports = {
	send(data) {
		io.emit('result', data);
	},
	// Set an event listener for the web panel with access to local variables.
	// This is for the client (web panel) to send a request (like "send message") to the server.
	// I can't find a way to dynamically attach event listeners, so you should add any event listeners you want while loading the bot, meaning you won't be able to add events in a command for example until the web panel page is refreshed. Though now that I think of it, why would you need to? If you want to log data to the web panel's console, just use panel.send().
	listen(id, callback) {
		if (!id || !callback) return console.error("No valid callback function or ID was provided for listening to the web panel!");
		listeners.set(id, callback);
	}
};