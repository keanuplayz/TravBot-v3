import $, { isType, parseVars, CommonLibrary } from './lib';
import { Collection } from 'discord.js';
import { generateHandler } from './storage';
import { promises as ffs, existsSync, writeFile } from 'fs';
import { PERMISSIONS } from './permissions';
import { getPrefix } from '../core/structures';

interface CommandOptions {
  description?: string;
  endpoint?: boolean;
  usage?: string;
  permission?: PERMISSIONS | null;
  aliases?: string[];
  run?: (($: CommonLibrary) => Promise<any>) | string;
  subcommands?: { [key: string]: Command };
  user?: Command;
  number?: Command;
  any?: Command;
}

export enum TYPES {
  SUBCOMMAND,
  USER,
  NUMBER,
  ANY,
  NONE,
}

export default class Command {
  public readonly description: string;
  public readonly endpoint: boolean;
  public readonly usage: string;
  public readonly permission: PERMISSIONS | null;
  public readonly aliases: string[]; // This is to keep the array intact for parent Command instances to use. It'll also be used when loading top-level aliases.
  public originalCommandName: string | null; // If the command is an alias, what's the original name?
  public run: (($: CommonLibrary) => Promise<any>) | string;
  public readonly subcommands: Collection<string, Command>; // This is the final data structure you'll actually use to work with the commands the aliases point to.
  public user: Command | null;
  public number: Command | null;
  public any: Command | null;
  public static readonly TYPES = TYPES;
  public static readonly PERMISSIONS = PERMISSIONS;

  constructor(options?: CommandOptions) {
    this.description = options?.description || 'No description.';
    this.endpoint = options?.endpoint || false;
    this.usage = options?.usage || '';
    this.permission = options?.permission ?? null;
    this.aliases = options?.aliases ?? [];
    this.originalCommandName = null;
    this.run = options?.run || 'No action was set on this command!';
    this.subcommands = new Collection(); // Populate this collection after setting subcommands.
    this.user = options?.user || null;
    this.number = options?.number || null;
    this.any = options?.any || null;

    if (options?.subcommands) {
      const baseSubcommands = Object.keys(options.subcommands);

      // Loop once to set the base subcommands.
      for (const name in options.subcommands)
        this.subcommands.set(name, options.subcommands[name]);

      // Then loop again to make aliases point to the base subcommands and warn if something's not right.
      // This shouldn't be a problem because I'm hoping that JS stores these as references that point to the same object.
      for (const name in options.subcommands) {
        const subcmd = options.subcommands[name];
        subcmd.originalCommandName = name;
        const aliases = subcmd.aliases;

        for (const alias of aliases) {
          if (baseSubcommands.includes(alias))
            $.warn(
              `"${alias}" in subcommand "${name}" was attempted to be declared as an alias but it already exists in the base commands! (Look at the next "Loading Command" line to see which command is affected.)`,
            );
          else if (this.subcommands.has(alias))
            $.warn(
              `Duplicate alias "${alias}" at subcommand "${name}"! (Look at the next "Loading Command" line to see which command is affected.)`,
            );
          else this.subcommands.set(alias, subcmd);
        }
      }
    }

    if (this.user && this.user.aliases.length > 0)
      $.warn(
        `There are aliases defined for a "user"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`,
      );
    if (this.number && this.number.aliases.length > 0)
      $.warn(
        `There are aliases defined for a "number"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`,
      );
    if (this.any && this.any.aliases.length > 0)
      $.warn(
        `There are aliases defined for an "any"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`,
      );
  }

  public execute($: CommonLibrary) {
    if (isType(this.run, String)) {
      $.channel.send(
        parseVars(
          this.run as string,
          {
            author: $.author.toString(),
            prefix: getPrefix($.guild),
          },
          '???',
        ),
      );
    } else (this.run as Function)($).catch($.handler.bind($));
  }

  public resolve(param: string): TYPES {
    if (this.subcommands.has(param)) return TYPES.SUBCOMMAND;
    // Any Discord ID format will automatically format to a user ID.
    else if (this.user && /\d{17,19}/.test(param)) return TYPES.USER;
    // Disallow infinity and allow for 0.
    else if (
      this.number &&
      (Number(param) || param === '0') &&
      !param.includes('Infinity')
    )
      return TYPES.NUMBER;
    else if (this.any) return TYPES.ANY;
    else return TYPES.NONE;
  }

  public get(param: string): Command {
    const type = this.resolve(param);
    let command: Command;

    switch (type) {
      case TYPES.SUBCOMMAND:
        command = this.subcommands.get(param) as Command;
        break;
      case TYPES.USER:
        command = this.user as Command;
        break;
      case TYPES.NUMBER:
        command = this.number as Command;
        break;
      case TYPES.ANY:
        command = this.any as Command;
        break;
      default:
        command = this;
        break;
    }

    return command;
  }
}

let commands: Collection<string, Command> | null = null;
export const categories: Collection<string, string[]> = new Collection();
export const aliases: Collection<string, string> = new Collection(); // Top-level aliases only.

/** Returns the cache of the commands if it exists and searches the directory if not. */
export async function loadCommands(): Promise<Collection<string, Command>> {
  if (commands) return commands;

  if (process.argv[2] === 'dev' && !existsSync('src/commands/test.ts'))
    writeFile(
      'src/commands/test.ts',
      template,
      generateHandler(
        '"test.ts" (testing/template command) successfully generated.',
      ),
    );

  commands = new Collection();
  const dir = await ffs.opendir('dist/commands');
  const listMisc: string[] = [];
  let selected;

  // There will only be one level of directory searching (per category).
  while ((selected = await dir.read())) {
    if (selected.isDirectory()) {
      if (selected.name === 'subcommands') continue;

      const subdir = await ffs.opendir(`dist/commands/${selected.name}`);
      const category = $(selected.name).toTitleCase();
      const list: string[] = [];
      let cmd;

      while ((cmd = await subdir.read())) {
        if (cmd.isDirectory()) {
          if (cmd.name === 'subcommands') continue;
          else
            $.warn(
              `You can't have multiple levels of directories! From: "dist/commands/${cmd.name}"`,
            );
        } else loadCommand(cmd.name, list, selected.name);
      }

      subdir.close();
      categories.set(category, list);
    } else loadCommand(selected.name, listMisc);
  }

  dir.close();
  categories.set('Miscellaneous', listMisc);

  return commands;
}

async function loadCommand(
  filename: string,
  list: string[],
  category?: string,
) {
  if (!commands)
    return $.error(
      `Function "loadCommand" was called without first initializing commands!`,
    );

  const prefix = category ?? '';
  const header = filename.substring(0, filename.indexOf('.js'));
  const command = (await import(`../commands/${prefix}/${header}`)).default as
    | Command
    | undefined;

  if (!command)
    return $.warn(
      `Command "${header}" has no default export which is a Command instance!`,
    );

  command.originalCommandName = header;
  list.push(header);

  if (commands.has(header))
    $.warn(
      `Command "${header}" already exists! Make sure to make each command uniquely identifiable across categories!`,
    );
  else commands.set(header, command);

  for (const alias of command.aliases) {
    if (commands.has(alias))
      $.warn(
        `Top-level alias "${alias}" from command "${header}" already exists either as a command or alias!`,
      );
    else commands.set(alias, command);
  }

  $.log(
    `Loading Command: ${header} (${
      category ? $(category).toTitleCase() : 'Miscellaneous'
    })`,
  );
}

// The template should be built with a reductionist mentality.
// Provide everything the user needs and then let them remove whatever they want.
// That way, they aren't focusing on what's missing, but rather what they need for their command.
const template = `import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	description: "This is a template/testing command providing common functionality. Remove what you don't need, and rename/delete this file to generate a fresh command file here. This command should be automatically excluded from the help command. The \\"usage\\" parameter (string) overrides the default usage for the help command. The \\"endpoint\\" parameter (boolean) prevents further arguments from being passed. Also, as long as you keep the run function async, it'll return a promise allowing the program to automatically catch any synchronous errors. However, you'll have to do manual error handling if you go the then and catch route.",
	endpoint: false,
	usage: '',
	permission: null,
	aliases: [],
	async run($: CommonLibrary): Promise<any> {
		
	},
	subcommands: {
		layer: new Command({
			description: "This is a named subcommand, meaning that the key name is what determines the keyword to use. With default settings for example, \\"$test layer\\".",
			endpoint: false,
			usage: '',
			permission: null,
			aliases: [],
			async run($: CommonLibrary): Promise<any> {
				
			}
		})
	},
	user: new Command({
		description: "This is the subcommand for getting users by pinging them or copying their ID. With default settings for example, \\"$test 237359961842253835\\". The argument will be a user object and won't run if no user is found by that ID.",
		endpoint: false,
		usage: '',
		permission: null,
		async run($: CommonLibrary): Promise<any> {
			
		}
	}),
	number: new Command({
		description: "This is a numeric subcommand, meaning that any type of number (excluding Infinity/NaN) will route to this command if present. With default settings for example, \\"$test -5.2\\". The argument with the number is already parsed so you can just use it without converting it.",
		endpoint: false,
		usage: '',
		permission: null,
		async run($: CommonLibrary): Promise<any> {
			
		}
	}),
	any: new Command({
		description: "This is a generic subcommand, meaning that if there isn't a more specific subcommand that's called, it falls to this. With default settings for example, \\"$test reeee\\".",
		endpoint: false,
		usage: '',
		permission: null,
		async run($: CommonLibrary): Promise<any> {
			
		}
	})
});`;
