const BotClient = require("./Structures/BotClient");
const config = require("../config.json");

const client = new BotClient(config);
client.login();