import Command from '../../core/command';
import { CommonLibrary } from '../../core/lib';

export default new Command({
    description: "Renames current voice channel.",
    usage: "<name>",
    async run($: CommonLibrary): Promise<any> {
        const voiceChannel = $.message.member?.voice.channel;
        if (!voiceChannel)
          return $.channel.send('You are not in a voice channel.');
        if (!$.guild?.me?.hasPermission('MANAGE_CHANNELS'))
          return $.channel.send(
            'I am lacking the required permissions to perform this action.',
          );
        if ($.args.length === 0)
          return $.channel.send(
            'Please provide a new voice channel name.',
          );
        const changeVC = $.guild.channels.resolve(voiceChannel.id);
        $.channel
          .send(
            `Changed channel name from "${voiceChannel}" to "${$.args.join(
              ' ',
            )}".`,
          )
          /// @ts-ignore
          .then(changeVC?.setName($.args.join(' ')));
    }
})