import Database from "better-sqlite3";
import {existsSync} from "fs";
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
// Users: ID, Money (INT), LastReceived (TIME), LastMonday (TIME), TimezoneOffset (INT NULLABLE), DaylightSavingsRegion (INT), EcoBetInsurance (INT)
// Guilds: ID, Prefix (TEXT NULLABLE), WelcomeType (INT), WelcomeChannel (TEXT NULLABLE), WelcomeMessage (TEXT NULLABLE), StreamingChannel (TEXT NULLABLE), HasMessageEmbeds (BOOL)
// Members: UserID, GuildID, StreamCategory (TEXT NULLABLE)
// Webhooks: ID, Token (TEXT)
// TodoLists: UserID, Timestamp (TIME), Entry (TEXT)
// StreamingRoles: GuildID, RoleID, Category (TEXT)
// DefaultChannelNames: GuildID, ChannelID, Name (TEXT)
// AutoRoles: GuildID, RoleID

// -=[ Notes ]=-
// - Unless otherwise directed above (NULLABLE), assume the "NOT NULL" constraint.
// - IDs use the "UNIQUE ON CONFLICT REPLACE" constraint to enable implicit UPSERT statements.
//   - This way, you don't need to do INSERT INTO ... ON CONFLICT(...) DO UPDATE SET ...
// - For the sake of simplicity, any Discord ID will be stored and retrieved as a string.
// - Any datetime stuff (marked as TIME) will be stored as a UNIX timestamp in milliseconds (INT).
// - Booleans (marked as BOOL) will be stored as an integer, either 0 or 1 (though it just checks for 0).

// Calling migrations[2]() migrates the database from version 2 to version 3.
// NOTE: Once a migration is written, DO NOT change that migration or it'll break all future migrations.
const migrations: (() => void)[] = [
    () => {
        const hasLegacyData = existsSync(join("data", "config.json")) && existsSync(join("data", "storage.json"));

        // Generate initial state
        // Stuff like CREATE TABLE IF NOT EXISTS should be handled by the migration system.
        generateSQLMigration([
            `CREATE TABLE System (
				Version INT NOT NULL UNIQUE
			)`,
            "INSERT INTO System VALUES (1)",
            `CREATE TABLE Users (
				ID TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,
				Money INT NOT NULL DEFAULT 0,
				LastReceived INT NOT NULL DEFAULT -1,
				LastMonday INT NOT NULL DEFAULT -1,
				TimezoneOffset INT,
				DaylightSavingsRegion INT NOT NULL DEFAULT 0,
				EcoBetInsurance INT NOT NULL DEFAULT 0
			)`,
            `CREATE TABLE Guilds (
				ID TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,
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
				UNIQUE (UserID, GuildID) ON CONFLICT REPLACE
			)`,
            `CREATE TABLE Webhooks (
				ID TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,
				Token TEXT NOT NULL
			)`,
            `CREATE TABLE TodoLists (
				UserID TEXT NOT NULL,
				Timestamp INT NOT NULL,
				Entry TEXT NOT NULL
			)`,
            `CREATE TABLE StreamingRoles (
				GuildID TEXT NOT NULL,
				RoleID TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,
				Category TEXT NOT NULL
			)`,
            `CREATE TABLE DefaultChannelNames (
				GuildID TEXT NOT NULL,
				ChannelID TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,
				Name TEXT NOT NULL
			)`,
            `CREATE TABLE AutoRoles (
				GuildID TEXT NOT NULL,
				RoleID TEXT NOT NULL UNIQUE ON CONFLICT REPLACE
			)`
        ])();

        // Load initial data if present
        if (hasLegacyData) {
            generateSQLMigration([])();
        }
    }
    // "UPDATE System SET Version=2" when the time comes
];

const isExistingDatabase = existsSync(join("data", "main.db"));
export const db = new Database(join("data", "main.db"));
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
    }
}

function generateSQLMigration(statements: string[]): () => void {
    return () => {
        for (const statement of statements) {
            db.prepare(statement).run();
        }
    };
}
