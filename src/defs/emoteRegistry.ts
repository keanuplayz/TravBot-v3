import {Snowflake} from "discord.js";

export interface EmoteRegistryDumpEntry {
    ref: string | null;
    id: Snowflake;
    name: string | null;
    requires_colons: boolean;
    animated: boolean;
    url: string;
    guild_id: Snowflake;
    guild_name: string;
}

export interface EmoteRegistryDump {
    version: number;
    list: EmoteRegistryDumpEntry[];
}
