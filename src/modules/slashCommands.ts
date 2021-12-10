import {client} from "../index";
import {join} from "path";
import {loadCommands} from "../modules/slashCommandsLoader";

loadCommands(join(__dirname, "..", "commands")).then((result) => {
    const [headers, handlers] = result;
    const useDevGuild = IS_DEV_MODE && !!process.env.DEV_GUILD;

    // Send slash command data to Discord

    client.on("ready", async () => {
        try {
            if (useDevGuild) {
                await client.guilds.cache
                    .get(process.env.DEV_GUILD!)!
                    .commands.set(headers.map((header) => header.toJSON()));
            } else {
                await client.application!.commands.set(headers.map((header) => header.toJSON()));
            }

            console.log(
                `Successfully loaded command definitions into Discord using ${
                    useDevGuild ? "development" : "production"
                } mode.`
            );
        } catch (error) {
            console.error(error);
        }
    });

    // Listen for slash commands

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
            if (handlers.has(interaction.commandName)) {
                try {
                    await handlers.get(interaction.commandName)!(interaction);
                } catch (error) {
                    console.error(error);
                }

                // Use these when implementing subcommands and subcommand groups
                // interaction.options.getSubcommandGroup(false); // string if exists, null if not
                // interaction.options.getSubcommand(false); // string if exists, null if not
            } else {
                interaction.reply({
                    content:
                        "**Error:** Invalid command name! This probably means that the command definitions forgot to be updated.",
                    ephemeral: true
                });
            }
        }
    });
});
