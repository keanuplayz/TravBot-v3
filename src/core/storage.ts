import fs from "fs";
import $ from "./lib";
import {Collection, Client} from "discord.js";
import Command, {template} from "../core/command";
import {EVENTS} from "./event";

let commands: Collection<string, Command>|null = null;

const Storage = {
	read(header: string): object
	{
		this.open("data");
		const path = `data/${header}.json`;
		let data = {};
		
		if(fs.existsSync(path))
		{
			const file = fs.readFileSync(path, "utf-8");
			
			try
			{
				data = JSON.parse(file);
			}
			catch(error)
			{
				if(process.argv[2] !== "dev")
				{
					$.warn(`Malformed JSON data (header: ${header}), backing it up.`, file);
					fs.writeFile(`${path}.backup`, file, generateHandler(`Backup file of "${header}" successfully written as ${file}.`));
				}
			}
		}
		
		return data;
	},
	write(header: string, data: object, asynchronous = true)
	{
		this.open("data");
		const path = `data/${header}.json`;
		
		if(process.argv[2] === "dev" || header === "config")
		{
			const result = JSON.stringify(data, null, '\t');
			
			if(asynchronous)
				fs.writeFile(path, result, generateHandler(`"${header}" sucessfully spaced and written.`));
			else
				fs.writeFileSync(path, result);
		}
		else
		{
			const result = JSON.stringify(data);
			
			if(asynchronous)
				fs.writeFile(path, result, generateHandler(`"${header}" sucessfully written.`));
			else
				fs.writeFileSync(path, result);
		}
	},
	open(path: string, filter?: (value: string, index: number, array: string[]) => unknown): string[]
	{
		if(!fs.existsSync(path))
			fs.mkdirSync(path);
		
		let directory = fs.readdirSync(path);
		
		if(filter)
			directory = directory.filter(filter);
		
		return directory;
	},
	close(path: string)
	{
		if(fs.existsSync(path) && fs.readdirSync(path).length === 0)
			fs.rmdir(path, generateHandler(`"${path}" successfully closed.`));
	},
	/** Returns the cache of the commands if it exists and searches the directory if not. */
	async loadCommands(): Promise<Collection<string, Command>>
	{
		if(commands)
			return commands;
		
		if(process.argv[2] === "dev" && !fs.existsSync("src/commands/test.ts"))
			fs.writeFile("src/commands/test.ts", template, generateHandler('"test.ts" (testing/template command) successfully generated.'));
		
		commands = new Collection();
		
		for(const file of Storage.open("dist/commands", (filename: string) => filename.endsWith(".js")))
		{
			const header = file.substring(0, file.indexOf(".js"));
			const command = (await import(`../commands/${header}`)).default;
			commands.set(header, command);
			$.log(`Loading Command: ${header}`);
		}
		
		return commands;
	},
	async loadEvents(client: Client)
	{
		for(const file of Storage.open("dist/events", (filename: string) => filename.endsWith(".js")))
		{
			const header = file.substring(0, file.indexOf(".js"));
			const event = (await import(`../events/${header}`)).default;
			
			if(EVENTS.includes(header))
			{
				event.attach(client, header);
				$.log(`Loading Event: ${header}`);
			}
			else
				$.warn(`"${header}" is not a valid event type! Did you misspell it? (Note: If you fixed the issue, delete "dist" because the compiler won't automatically delete any extra files.)`);
		}
	}
};

function generateHandler(message: string)
{
	return (error: Error|null) => {
		if(error)
			$.error(error);
		else
			$.debug(message);
	};
};

export default Storage;