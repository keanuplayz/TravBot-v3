import Database from "better-sqlite3";
import {existsSync, readFileSync} from "fs";
import {join} from "path";

// This section will serve as the documentation for the database, because in order to guarantee
// that a database created now will have the same structure as a database that has been migrated
// through different versions, a new database starts at version one and goes through the same
// migration process. Creating separate statements for migrations and creating a new database will
// allow for some dangerous out of sync definitions. For example, version 9 via migration might
// have a column that forgot to be dropped while version 9 via creation won't include that column,
// so when someone tries to use an INSERT statement, it'll throw an error because of discrepancies.

// -=[ Current Schema ]=-
// System: Version (INT UNIQUE)
// Settings: Group, SystemLogsChannel (TEXT NULLABLE)
// Users: ID, Money (INT), LastReceived (TIME), LastMonday (TIME), TimezoneOffset (INT NULLABLE), DaylightSavingsRegion (INT), EcoBetInsurance (INT)
// Guilds: ID, Prefix (TEXT NULLABLE), WelcomeType (INT), WelcomeChannel (TEXT NULLABLE), WelcomeMessage (TEXT NULLABLE), StreamingChannel (TEXT NULLABLE), HasMessageEmbeds (BOOL)
// Members: UserID, GuildID, StreamCategory (TEXT NULLABLE)
// Webhooks: ID, Token (TEXT)
// TodoLists: ID (INT PRIMARY KEY), UserID, Entry (TEXT), LastModified (TIME)
// StreamingRoles: GuildID, RoleID, Category (TEXT)
// DefaultChannelNames: GuildID, ChannelID, Name (TEXT)
// AutoRoles: GuildID, RoleID

// -=[ Notes ]=-
// - System is a special table and its sole purpose is to store the version number.
// - In theory, you could create different settings groups if you really wanted to.
// - Unless otherwise directed above (NULLABLE), assume the "NOT NULL" constraint.
// - IDs use the "ON CONFLICT REPLACE" constraint to enable implicit UPSERT statements.
//   - Note that you cannot replace a single column with this.
// - For the sake of simplicity, any Discord ID will be stored and retrieved as a string.
// - Any datetime stuff (marked as TIME) will be stored as a UNIX timestamp in milliseconds (INT).
// - Booleans (marked as BOOL) will be stored as an integer, either 0 or 1 (though it just checks for 0).

const DATA_FOLDER = "data";
const DATABASE_FILE = join(DATA_FOLDER, `${process.env.DEV_DATABASE ?? "main"}.db`);

// Calling migrations[2]() migrates the database from version 2 to version 3.
// NOTE: Once a migration is written, DO NOT change that migration or it'll break all future migrations.
const migrations: (() => void)[] = [
    () => {
        const CONFIG_FILE = join(DATA_FOLDER, "config.json");
        const STORAGE_FILE = join(DATA_FOLDER, "storage.json");
        const hasLegacyData = existsSync(CONFIG_FILE) && existsSync(STORAGE_FILE);

        // Generate initial state
        // Stuff like CREATE TABLE IF NOT EXISTS should be handled by the migration system.
        generateSQLMigration([
            `CREATE TABLE System (
				Version INT NOT NULL UNIQUE
			)`,
            "INSERT INTO System VALUES (1)",
            `CREATE TABLE Settings (
                Tag TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
                SystemLogsChannel TEXT
            )`,
            "INSERT INTO Settings (Tag) VALUES ('Main')",
            `CREATE TABLE Users (
				ID TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
				Money INT NOT NULL DEFAULT 0,
				LastReceived INT NOT NULL DEFAULT -1,
				LastMonday INT NOT NULL DEFAULT -1,
				TimezoneOffset INT,
				DaylightSavingsRegion INT NOT NULL DEFAULT 0,
				EcoBetInsurance INT NOT NULL DEFAULT 0
			)`,
            `CREATE TABLE Guilds (
				ID TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
				Prefix TEXT,
				WelcomeType INT NOT NULL DEFAULT 0,
				WelcomeChannel TEXT,
				WelcomeMessage TEXT,
				StreamingChannel TEXT,
				HasMessageEmbeds INT NOT NULL CHECK(HasMessageEmbeds BETWEEN 0 AND 1) DEFAULT 1
			)`,
            `CREATE TABLE Members (
				UserID TEXT NOT NULL,
				GuildID TEXT NOT NULL,
				StreamCategory TEXT,
				PRIMARY KEY (UserID, GuildID) ON CONFLICT REPLACE
			)`,
            `CREATE TABLE Webhooks (
				ID TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
				Token TEXT NOT NULL
			)`,
            `CREATE TABLE TodoLists (
                ID INTEGER NOT NULL PRIMARY KEY ON CONFLICT REPLACE AUTOINCREMENT,
				UserID TEXT NOT NULL,
				Entry TEXT NOT NULL,
				LastModified INT NOT NULL
			)`,
            `CREATE TABLE StreamingRoles (
				GuildID TEXT NOT NULL,
				RoleID TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
				Category TEXT NOT NULL
			)`,
            `CREATE TABLE DefaultChannelNames (
				GuildID TEXT NOT NULL,
				ChannelID TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
				Name TEXT NOT NULL
			)`,
            `CREATE TABLE AutoRoles (
				GuildID TEXT NOT NULL,
				RoleID TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE
			)`
        ])();

        // Load initial data if present
        if (hasLegacyData) {
            const config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
            const {users, guilds} = JSON.parse(readFileSync(STORAGE_FILE, "utf-8"));
            db.prepare("INSERT INTO Settings VALUES ('Main', ?)").run(config.systemLogsChannel);
            const addWebhooks = db.prepare("INSERT INTO Webhooks VALUES (?, ?)");
            const addUsers = db.prepare("INSERT INTO Users VALUES (?, ?, ?, ?, ?, ?, ?)");
            const addTodoLists = db.prepare("INSERT INTO TodoLists (UserID, Entry, LastModified) VALUES (?, ?, ?)");
            const addGuilds = db.prepare("INSERT INTO Guilds VALUES (?, ?, ?, ?, ?, ?, ?)");
            const addMembers = db.prepare("INSERT INTO Members VALUES (?, ?, ?)");
            const addStreamingRoles = db.prepare("INSERT INTO StreamingRoles VALUES (?, ?, ?)");
            const addDefaultChannelNames = db.prepare("INSERT INTO DefaultChannelNames VALUES (?, ?, ?)");
            const addAutoRoles = db.prepare("INSERT INTO AutoRoles VALUES (?, ?)");

            for (const [id, token] of Object.entries(config.webhooks)) {
                addWebhooks.run(id, token);
            }

            for (const id in users) {
                const {money, lastReceived, lastMonday, timezone, daylightSavingsRegion, todoList, ecoBetInsurance} =
                    users[id];
                let dstInfo = 0;

                if (daylightSavingsRegion !== null) {
                    switch (daylightSavingsRegion) {
                        case "na":
                            dstInfo = 1;
                            break;
                        case "eu":
                            dstInfo = 2;
                            break;
                        case "sh":
                            dstInfo = 3;
                            break;
                    }
                }

                addUsers.run(id, money, lastReceived, lastMonday, timezone, dstInfo, ecoBetInsurance);

                for (const timestamp in todoList) {
                    const entry = todoList[timestamp];
                    addTodoLists.run(id, entry, Number(timestamp));
                }
            }

            for (const id in guilds) {
                const {
                    prefix,
                    messageEmbeds,
                    welcomeChannel,
                    welcomeMessage,
                    autoRoles,
                    streamingChannel,
                    streamingRoles,
                    channelNames,
                    members,
                    welcomeType
                } = guilds[id];
                let welcomeTypeInt = 0;

                switch (welcomeType) {
                    case "text":
                        welcomeTypeInt = 1;
                        break;
                    case "graphical":
                        welcomeTypeInt = 2;
                        break;
                }

                addGuilds.run(
                    id,
                    prefix,
                    welcomeTypeInt,
                    welcomeChannel,
                    welcomeMessage,
                    streamingChannel,
                    +messageEmbeds
                );

                for (const userID in members) {
                    const {streamCategory} = members[userID];
                    addMembers.run(userID, id, streamCategory);
                }

                for (const roleID in streamingRoles) {
                    const category = streamingRoles[roleID];
                    addStreamingRoles.run(id, roleID, category);
                }

                for (const channelID in channelNames) {
                    const channelName = channelNames[channelID];
                    addDefaultChannelNames.run(id, channelID, channelName);
                }

                if (autoRoles) {
                    for (const roleID of autoRoles) {
                        addAutoRoles.run(id, roleID);
                    }
                }
            }
        }
    }
    // generateSQLMigration([])
];

const isExistingDatabase = existsSync(DATABASE_FILE);
export const db = new Database(DATABASE_FILE);
let version = -1;

// Get existing version if applicable and throw error if corrupt data.
// The data is considered corrupt if it exists and:
// - The System table doesn't exist (throws an error)
// - There isn't exactly one entry in System for Version
if (isExistingDatabase) {
    try {
        const {Version, Amount} = db.prepare("SELECT Version, Count(Version) AS Amount FROM System").get() as {
            Version: number | null;
            Amount: number;
        };

        if (!Version) {
            console.error("No version entry in the System table.");
        } else if (Amount === 1) {
            version = Version;
        } else {
            console.error("More than one version entry in the System table.");
        }
    } catch (error) {
        console.error(error);
        console.error("Invalid database, take a look at it manually.");
    }
} else {
    version = 0;
}

// Then loop through all the versions
if (version !== -1) {
    for (let v = version; v < migrations.length; v++) {
        migrations[v]();

        if (v >= 1) {
            db.prepare("UPDATE System SET Version = ?").run(v + 1);
        }
    }
}

function generateSQLMigration(statements: string[]): () => void {
    return () => {
        for (const statement of statements) {
            db.prepare(statement).run();
        }
    };
}
