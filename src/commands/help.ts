import Command from "../core/command";
import {CommonLibrary} from "../core/lib";
import FileManager from "../core/storage";

const types = ["user", "number", "any"];

export default new Command({
	description: "Lists all commands. If a command is specified, their arguments are listed as well.",
	usage: "([command, [subcommand/type], ...])",
	async run($: CommonLibrary): Promise<any>
	{
		const commands = await FileManager.loadCommands();
		const list: string[] = [];
		
		for(const [header, command] of commands)
			if(header !== "test")
				list.push(`- \`${header}\` - ${command.description}`);
		
		const outList = list.length > 0 ? `\n${list.join('\n')}` : " None";
		$.channel.send(`Legend: \`<type>\`, \`[list/of/subcommands]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\`\nCommands:${outList}`, {split: true});
	},
	any: new Command({
		async run($: CommonLibrary): Promise<any>
		{
			const commands = await FileManager.loadCommands();
			let header = $.args.shift();
			let command = commands.get(header);
			
			if(!command || header === "test")
				$.channel.send(`No command found by the name \`${header}\`!`);
			else
			{
				let usage = command.usage;
				
				for(const param of $.args)
				{
					header += ` ${param}`;
					
					if(/<\w+>/g.test(param))
					{
						const type = param.match(/\w+/g)[0];
						command = command[type];
						
						if(types.includes(type) && command?.usage)
							usage = command.usage;
						else
						{
							command = undefined;
							break;
						}
					}
					else if(command?.subcommands?.[param])
					{
						command = command.subcommands[param];
						
						if(command.usage !== "")
							usage = command.usage;
					}
					else
					{
						command = undefined;
						break;
					}
				}
				
				if(!command)
					return $.channel.send(`No command found by the name \`${header}\`!`);
				
				let append = "";
				
				if(usage === "")
				{
					const list: string[] = [];
					
					for(const subtag in command.subcommands)
					{
						const subcmd = command.subcommands[subtag];
						const customUsage = subcmd.usage ? ` ${subcmd.usage}` : "";
						list.push(`- \`${header} ${subtag}${customUsage}\` - ${subcmd.description}`);
					}
					
					for(const type of types)
					{
						if(command[type])
						{
							const cmd = command[type];
							const customUsage = cmd.usage ? ` ${cmd.usage}` : "";
							list.push(`- \`${header} <${type}>${customUsage}\` - ${cmd.description}`);
						}
					}
						
					
					append = "Usages:" + (list.length > 0 ? `\n${list.join('\n')}` : " None.");
				}
				else
					append = `Usage: \`${header} ${usage}\``;
				
				$.channel.send(`Command: \`${header}\`\nDescription: ${command.description}\n${append}`, {split: true});
			}
		}
	})
});