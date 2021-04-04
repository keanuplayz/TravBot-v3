import Command from "../../core/command";
import {streamList, getStreamEmbed} from "../../events/voiceStateUpdate";

export default new Command({
    description: "Sets the description of your stream. You can embed links by writing `[some name](some link)`",
    async run($) {
        const userID = $.author.id;

        if (streamList.has(userID)) {
            const stream = streamList.get(userID)!;
            stream.description = $.args.join(" ") || undefined;
            stream.message.edit(getStreamEmbed(stream.streamer, stream.channel, stream.description));
        } else {
            // Alternatively, I could make descriptions last outside of just one stream.
            $.channel.send("You can only use this command when streaming.");
        }
    }
});
