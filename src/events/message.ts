import Event from '../core/event';
import Command, { loadCommands } from '../core/command';
import {
  hasPermission,
  getPermissionLevel,
  PermissionNames,
} from '../core/permissions';
import { Permissions, Collection } from 'discord.js';
import { getPrefix } from '../core/structures';
import $ from '../core/lib';

// It's a rather hacky solution, but since there's no top-level await, I just have to make the loading conditional.
let commands: Collection<string, Command> | null = null;

export default new Event<'message'>({
  async on(message) {
    // Load commands if it hasn't already done so. Luckily, it's called once at most.
    if (!commands) commands = await loadCommands();

    // Message Setup //
    if (message.author.bot) return;

    const prefix = getPrefix(message.guild);

    if (!message.content.startsWith(prefix)) {
      if (message.client.user && message.mentions.has(message.client.user))
        message.channel.send(
          `${message.author.toString()}, my prefix on this guild is \`${prefix}\`.`,
        );
      return;
    }

    const [header, ...args] = message.content
      .substring(prefix.length)
      .split(/ +/);

    if (!commands.has(header)) return;

    if (
      message.channel.type === 'text' &&
      !message.channel
        .permissionsFor(message.client.user || '')
        ?.has(Permissions.FLAGS.SEND_MESSAGES)
    ) {
      let status;

      if (message.member?.hasPermission(Permissions.FLAGS.ADMINISTRATOR))
        status =
          "Because you're a server admin, you have the ability to change that channel's permissions to match if that's what you intended.";
      else
        status =
          "Try using a different channel or contacting a server admin to change permissions of that channel if you think something's wrong.";

      return message.author.send(
        `I don't have permission to send messages in ${message.channel.toString()}. ${status}`,
      );
    }

    $.log(
      `${message.author.username}#${message.author.discriminator} executed the command "${header}" with arguments "${args}".`,
    );

    // Subcommand Recursion //
    let command = commands.get(header);
    if (!command)
      return $.warn(
        `Command "${header}" was called but for some reason it's still undefined!`,
      );
    const params: any[] = [];
    let isEndpoint = false;
    let permLevel = command.permission ?? Command.PERMISSIONS.NONE;

    for (let param of args) {
      if (command.endpoint) {
        if (
          command.subcommands.size > 0 ||
          command.user ||
          command.number ||
          command.any
        )
          $.warn(
            `An endpoint cannot have subcommands! Check ${prefix}${header} again.`,
          );
        isEndpoint = true;
        break;
      }

      const type = command.resolve(param);
      command = command.get(param);
      permLevel = command.permission ?? permLevel;

      if (type === Command.TYPES.USER) {
        const id = param.match(/\d+/g)![0];
        try {
          params.push(await message.client.users.fetch(id));
        } catch (error) {
          return message.channel.send(`No user found by the ID \`${id}\`!`);
        }
      } else if (type === Command.TYPES.NUMBER) params.push(Number(param));
      else if (type !== Command.TYPES.SUBCOMMAND) params.push(param);
    }

    if (!message.member)
      return $.warn(
        'This command was likely called from a DM channel meaning the member object is null.',
      );

    if (!hasPermission(message.member, permLevel)) {
      const userPermLevel = getPermissionLevel(message.member);
      return message.channel.send(
        `You don't have access to this command! Your permission level is \`${PermissionNames[userPermLevel]}\` (${userPermLevel}), but this command requires a permission level of \`${PermissionNames[permLevel]}\` (${permLevel}).`,
      );
    }

    if (isEndpoint) return message.channel.send('Too many arguments!');

    // Execute with dynamic library attached. //
    // The purpose of using $.bind($) is to clone the function so as to not modify the original $.
    // The cloned function doesn't copy the properties, so Object.assign() is used.
    // Object.assign() modifies the first element and returns that, the second element applies its properties and the third element applies its own overriding the second one.
    command.execute(
      Object.assign(
        $.bind($),
        {
          args: params,
          author: message.author,
          channel: message.channel,
          client: message.client,
          guild: message.guild,
          member: message.member,
          message: message,
        },
        $,
      ),
    );
  },
});
