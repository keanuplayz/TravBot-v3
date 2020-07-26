import Command from "../core/command";
import {CommonLibrary} from "../core/lib";
import {loadCommands, categories} from "../core/command";

const types = ["user", "number", "any"];

export default new Command({
	description: "Lists all commands. If a command is specified, their arguments are listed as well.",
	usage: "([command, [subcommand/type], ...])",
	async run($: CommonLibrary): Promise<any>
	{
		const commands = await loadCommands();
		let output = `Legend: \`<type>\`, \`[list/of/subcommands]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\``;
		
		for(const [category, headers] of categories)
		{
			output += `\n\n===[ ${category} ]===`;
			
			for(const header of headers)
			{
				if(header !== "test")
				{
					const command = commands.get(header);
					
					if(!command)
						return $.warn(`Command "${header}" of category "${category}" unexpectedly doesn't exist!`);
					
					output += `\n- \`${header}\`: ${command.description}`;
				}
			}
		}
		
		$.channel.send(output, {split: true});
	},
	any: new Command({
		async run($: CommonLibrary): Promise<any>
		{
			const commands = await loadCommands();
			let header = $.args.shift();
			let command = commands.get(header);
			
			if(!command || header === "test")
				return $.channel.send(`No command found by the name \`${header}\`!`);
			
			let usage = command.usage;
			let invalid = false;
			
			for(const param of $.args)
			{
				const type = command.resolve(param);
				
				switch(type)
				{
					case Command.TYPES.SUBCOMMAND: header += ` ${param}`; break;
					case Command.TYPES.USER: header += " <user>" ; break;
					case Command.TYPES.NUMBER: header += " <number>" ; break;
					case Command.TYPES.ANY: header += " <any>" ; break;
					default: header += ` ${param}`; break;
				}
				
				if(type === Command.TYPES.NONE)
				{
					invalid = true;
					break;
				}
				
				command = command.get(param);
			}
			
			if(invalid)
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
	})
});