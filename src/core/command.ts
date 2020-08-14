import $, {isType, parseVars, CommonLibrary} from "./lib";
import {Collection} from "discord.js";
import {generateHandler} from "./storage";
import {promises as ffs, existsSync, writeFile} from "fs";
import {PERMISSIONS} from "./permissions";
import {getPrefix} from "../core/structures";

interface CommandOptions
{
	description?: string;
	endpoint?: boolean;
	usage?: string;
	permission?: PERMISSIONS;
	run?: Function|string;
	subcommands?: {[key: string]: Command};
	user?: Command;
	number?: Command;
	any?: Command;
}

export enum TYPES {SUBCOMMAND, USER, NUMBER, ANY, NONE};

export default class Command
{
	public readonly description: string;
	public readonly endpoint: boolean;
	public readonly usage: string;
	public readonly permission: PERMISSIONS|null;
	private run: Function|string;
	public subcommands: {[key: string]: Command}|null;
	public user: Command|null;
	public number: Command|null;
	public any: Command|null;
	[key: string]: any; // Allow for dynamic indexing. The CommandOptions interface will still prevent users from adding unused properties though.
	public static readonly TYPES = TYPES;
	public static readonly PERMISSIONS = PERMISSIONS;
	
	constructor(options?: CommandOptions)
	{
		this.description = options?.description || "No description.";
		this.endpoint = options?.endpoint || false;
		this.usage = options?.usage || "";
		this.permission = options?.permission ?? null;
		this.run = options?.run || "No action was set on this command!";
		this.subcommands = options?.subcommands || null;
		this.user = options?.user || null;
		this.number = options?.number || null;
		this.any = options?.any || null;
	}
	
	public execute($: CommonLibrary)
	{
		if(isType(this.run, String))
		{
			$.channel.send(parseVars(this.run as string, {
				author: $.author.toString(),
				prefix: getPrefix($.guild)
			}, "???"));
		}
		else
			(this.run as Function)($).catch($.handler.bind($));
	}
	
	/**
	 * Set what happens when the command is called.
	 * - If the command is a function, run it with one argument (the common library).
	 * - If the command is a string, it'll be sent as a message with %variables% replaced.
	 */
	public set(run: Function|string)
	{
		this.run = run;
	}
	
	/** The safe way to attach a named subcommand. */
	public attach(key: string, command: Command)
	{
		if(!this.subcommands)
			this.subcommands = {};
		this.subcommands[key] = command;
	}
	
	public resolve(param: string): TYPES
	{
		if(this.subcommands?.[param])
			return TYPES.SUBCOMMAND;
		// Any Discord ID format will automatically format to a user ID.
		else if(this.user && (/\d{17,19}/.test(param)))
			return TYPES.USER;
		// Disallow infinity and allow for 0.
		else if(this.number && (Number(param) || param === "0") && !param.includes("Infinity"))
			return TYPES.NUMBER;
		else if(this.any)
			return TYPES.ANY;
		else
			return TYPES.NONE;
	}
	
	public get(param: string): Command
	{
		const type = this.resolve(param);
		let command;
		
		switch(type)
		{
			case TYPES.SUBCOMMAND: command = this.subcommands![param]; break;
			case TYPES.USER: command = this.user as Command; break;
			case TYPES.NUMBER: command = this.number as Command; break;
			case TYPES.ANY: command = this.any as Command; break;
			default: command = this; break;
		}
		
		return command;
	}
}

let commands: Collection<string, Command>|null = null;
export const categories: Collection<string, string[]> = new Collection();

/** Returns the cache of the commands if it exists and searches the directory if not. */
export async function loadCommands(): Promise<Collection<string, Command>>
{
	if(commands)
		return commands;
	
	if(process.argv[2] === "dev" && !existsSync("src/commands/test.ts"))
		writeFile("src/commands/test.ts", template, generateHandler('"test.ts" (testing/template command) successfully generated.'));
	
	commands = new Collection();
	const dir = await ffs.opendir("dist/commands");
	const listMisc: string[] = [];
	let selected;
	
	// There will only be one level of directory searching (per category).
	while(selected = await dir.read())
	{
		if(selected.isDirectory())
		{
			if(selected.name === "subcommands")
				continue;
			
			const subdir = await ffs.opendir(`dist/commands/${selected.name}`);
			const category = getTitleCase(selected.name);
			const list: string[] = [];
			let cmd;
			
			while(cmd = await subdir.read())
			{
				if(cmd.isDirectory())
				{
					if(cmd.name === "subcommands")
						continue;
					else
						$.warn(`You can't have multiple levels of directories! From: "dist/commands/${cmd.name}"`);
				}
				else
				{
					const header = cmd.name.substring(0, cmd.name.indexOf(".js"));
					const command = (await import(`../commands/${selected.name}/${header}`)).default;
					list.push(header);
					
					if(commands.has(header))
						$.warn(`Command "${header}" already exists! Make sure to make each command uniquely identifiable across categories!`);
					else
						commands.set(header, command);
					
					$.log(`Loading Command: ${header} (${category})`);
				}
			}
			
			subdir.close();
			categories.set(category, list);
		}
		else
		{
			const header = selected.name.substring(0, selected.name.indexOf(".js"));
			const command = (await import(`../commands/${header}`)).default;
			listMisc.push(header);
			
			if(commands.has(header))
				$.warn(`Command "${header}" already exists! Make sure to make each command uniquely identifiable across categories.`);
			else
				commands.set(header, command);
			
			$.log(`Loading Command: ${header} (Miscellaneous)`);
		}
	}
	
	dir.close();
	categories.set("Miscellaneous", listMisc);
	
	return commands;
}

function getTitleCase(name: string): string
{
	if(name.length < 1)
		return name;
	const first = name[0].toUpperCase();
	return first + name.substring(1);
}

// The template should be built with a reductionist mentality.
// Provide everything the user needs and then let them remove whatever they want.
// That way, they aren't focusing on what's missing, but rather what they need for their command.
const template =
`import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	description: "This is a template/testing command providing common functionality. Remove what you don't need, and rename/delete this file to generate a fresh command file here. This command should be automatically excluded from the help command. The \\"usage\\" parameter (string) overrides the default usage for the help command. The \\"endpoint\\" parameter (boolean) prevents further arguments from being passed. Also, as long as you keep the run function async, it'll return a promise allowing the program to automatically catch any synchronous errors. However, you'll have to do manual error handling if you go the then and catch route.",
	endpoint: false,
	usage: '',
	async run($: CommonLibrary): Promise<any> {
		
	},
	subcommands: {
		layer: new Command({
			description: "This is a named subcommand, meaning that the key name is what determines the keyword to use. With default settings for example, \\"$test layer\\".",
			endpoint: false,
			usage: '',
			async run($: CommonLibrary): Promise<any> {
				
			}
		})
	},
	user: new Command({
		description: "This is the subcommand for getting users by pinging them or copying their ID. With default settings for example, \\"$test 237359961842253835\\". The argument will be a user object and won't run if no user is found by that ID.",
		endpoint: false,
		usage: '',
		async run($: CommonLibrary): Promise<any> {
			
		}
	}),
	number: new Command({
		description: "This is a numeric subcommand, meaning that any type of number (excluding Infinity/NaN) will route to this command if present. With default settings for example, \\"$test -5.2\\". The argument with the number is already parsed so you can just use it without converting it.",
		endpoint: false,
		usage: '',
		async run($: CommonLibrary): Promise<any> {
			
		}
	}),
	any: new Command({
		description: "This is a generic subcommand, meaning that if there isn't a more specific subcommand that's called, it falls to this. With default settings for example, \\"$test reeee\\".",
		endpoint: false,
		usage: '',
		async run($: CommonLibrary): Promise<any> {
			
		}
	})
});`;