import Command from '../core/command';
import { CommonLibrary } from '../core/lib';
import { loadCommands, categories } from '../core/command';
import { PermissionNames } from '../core/permissions';

export default new Command({
  description:
    'Lists all commands. If a command is specified, their arguments are listed as well.',
  usage: '([command, [subcommand/type], ...])',
  aliases: ['h'],
  async run($: CommonLibrary): Promise<any> {
    const commands = await loadCommands();
    let output = `Legend: \`<type>\`, \`[list/of/stuff]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\``;

    for (const [category, headers] of categories) {
      output += `\n\n===[ ${category} ]===`;

      for (const header of headers) {
        if (header !== 'test') {
          const command = commands.get(header);

          if (!command)
            return $.warn(
              `Command "${header}" of category "${category}" unexpectedly doesn't exist!`,
            );

          output += `\n- \`${header}\`: ${command.description}`;
        }
      }
    }

    $.channel.send(output, { split: true });
  },
  any: new Command({
    async run($: CommonLibrary): Promise<any> {
      const commands = await loadCommands();
      let header = $.args.shift() as string;
      let command = commands.get(header);

      if (!command || header === 'test')
        return $.channel.send(`No command found by the name \`${header}\`!`);

      if (command.originalCommandName) header = command.originalCommandName;
      else $.warn(`originalCommandName isn't defined for ${header}?!`);

      let permLevel = command.permission ?? Command.PERMISSIONS.NONE;
      let usage = command.usage;
      let invalid = false;

      let selectedCategory = 'Unknown';

      for (const [category, headers] of categories) {
        if (headers.includes(header)) {
          if (selectedCategory !== 'Unknown')
            $.warn(
              `Command "${header}" is somehow in multiple categories. This means that the command loading stage probably failed in properly adding categories.`,
            );
          else selectedCategory = category;
        }
      }

      for (const param of $.args) {
        const type = command.resolve(param);
        command = command.get(param);
        permLevel = command.permission ?? permLevel;

        switch (type) {
          case Command.TYPES.SUBCOMMAND:
            header += ` ${command.originalCommandName}`;
            break;
          case Command.TYPES.USER:
            header += ' <user>';
            break;
          case Command.TYPES.NUMBER:
            header += ' <number>';
            break;
          case Command.TYPES.ANY:
            header += ' <any>';
            break;
          default:
            header += ` ${param}`;
            break;
        }

        if (type === Command.TYPES.NONE) {
          invalid = true;
          break;
        }
      }

      if (invalid)
        return $.channel.send(`No command found by the name \`${header}\`!`);

      let append = '';

      if (usage === '') {
        const list: string[] = [];

        command.subcommands.forEach((subcmd, subtag) => {
          // Don't capture duplicates generated from aliases.
          if (subcmd.originalCommandName === subtag) {
            const customUsage = subcmd.usage ? ` ${subcmd.usage}` : '';
            list.push(
              `- \`${header} ${subtag}${customUsage}\` - ${subcmd.description}`,
            );
          }
        });

        const addDynamicType = (cmd: Command | null, type: string) => {
          if (cmd) {
            const customUsage = cmd.usage ? ` ${cmd.usage}` : '';
            list.push(
              `- \`${header} <${type}>${customUsage}\` - ${cmd.description}`,
            );
          }
        };

        addDynamicType(command.user, 'user');
        addDynamicType(command.number, 'number');
        addDynamicType(command.any, 'any');

        append =
          'Usages:' + (list.length > 0 ? `\n${list.join('\n')}` : ' None.');
      } else append = `Usage: \`${header} ${usage}\``;

      let aliases = 'None';

      if (command.aliases.length > 0) {
        aliases = '';

        for (let i = 0; i < command.aliases.length; i++) {
          const alias = command.aliases[i];
          aliases += `\`${alias}\``;

          if (i !== command.aliases.length - 1) aliases += ', ';
        }
      }

      $.channel.send(
        `Command: \`${header}\`\nAliases: ${aliases}\nCategory: \`${selectedCategory}\`\nPermission Required: \`${PermissionNames[permLevel]}\` (${permLevel})\nDescription: ${command.description}\n${append}`,
        { split: true },
      );
    },
  }),
});
