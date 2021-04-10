import {Collection, Client, User, GuildMember, Guild} from "discord.js";
import {attachMessageHandlerToClient} from "./handler";
import {attachEventListenersToClient} from "./eventListeners";
import {NamedCommand} from "./command";
import {loadCommands} from "./loader";

interface PermissionLevel {
    name: string;
    check: (user: User, member: GuildMember | null) => boolean;
}

type PrefixResolver = (guild: Guild | null) => string;
type CategoryTransformer = (text: string) => string;

// One potential option is to let the user customize system messages such as "This command must be executed in a guild."
// I decided not to do that because I don't think it'll be worth the trouble.
interface LaunchSettings {
    permissionLevels?: PermissionLevel[];
    getPrefix?: PrefixResolver;
    categoryTransformer?: CategoryTransformer;
}

// One alternative to putting everything in launch(client, ...) is to create an object then set each individual aspect, such as OnionCore.setPermissions(...).
// That way, you can split different pieces of logic into different files, then do OnionCore.launch(client).
// Additionally, each method would return the object so multiple methods could be chained, such as OnionCore.setPermissions(...).setPrefixResolver(...).launch(client).
// I decided to not do this because creating a class then having a bunch of boilerplate around it just wouldn't really be worth it.
// commandsDirectory requires an absolute path to work, so use __dirname.
export async function launch(newClient: Client, commandsDirectory: string, settings?: LaunchSettings) {
    // Core Launch Parameters //
    client.destroy(); // Release any resources/connections being used by the placeholder client.
    client = newClient;
    loadableCommands = loadCommands(commandsDirectory);
    attachMessageHandlerToClient(newClient);
    attachEventListenersToClient(newClient);

    // Additional Configuration //
    if (settings?.permissionLevels) {
        if (settings.permissionLevels.length > 0) permissionLevels = settings.permissionLevels;
        else console.warn("permissionLevels must have at least one element to work!");
    }
    if (settings?.getPrefix) getPrefix = settings.getPrefix;
    if (settings?.categoryTransformer) categoryTransformer = settings.categoryTransformer;
}

// Placeholder until properly loaded by the user.
export let loadableCommands = (async () => new Collection<string, NamedCommand>())();
export let client = new Client();
export let permissionLevels: PermissionLevel[] = [
    {
        name: "User",
        check: () => true
    }
];
export let getPrefix: PrefixResolver = () => ".";
export let categoryTransformer: CategoryTransformer = (text) => text;
