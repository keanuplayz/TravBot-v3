import chalk from "chalk";

declare global {
    var IS_DEV_MODE: boolean;
    var PERMISSIONS: typeof PermissionsEnum;

    interface Console {
        ready: (...data: any[]) => void;
    }
}

enum PermissionsEnum {
    NONE,
    MOD,
    ADMIN,
    OWNER,
    BOT_SUPPORT,
    BOT_ADMIN,
    BOT_OWNER
}

global.IS_DEV_MODE = process.argv[2] === "dev";
global.PERMISSIONS = PermissionsEnum;

const oldConsole = console;

export const logs: {[type: string]: string} = {
    error: "",
    warn: "",
    info: "",
    verbose: ""
};

function formatTimestamp(now = new Date()) {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const second = now.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function formatUTCTimestamp(now = new Date()) {
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = now.getUTCDate().toString().padStart(2, "0");
    const hour = now.getUTCHours().toString().padStart(2, "0");
    const minute = now.getUTCMinutes().toString().padStart(2, "0");
    const second = now.getUTCSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// The custom console. In order of verbosity, error, warn, log, and debug. Ready is a variation of log.
console = {
    ...oldConsole,
    // General Purpose Logger
    log(...args: any[]) {
        oldConsole.log(chalk.white.bgGray(formatTimestamp()), chalk.black.bgWhite("INFO"), ...args);
        const text = `[${formatUTCTimestamp()}] [INFO] ${args.join(" ")}\n`;
        logs.info += text;
        logs.verbose += text;
    },
    // "It'll still work, but you should really check up on this."
    warn(...args: any[]) {
        oldConsole.warn(chalk.white.bgGray(formatTimestamp()), chalk.black.bgYellow("WARN"), ...args);
        const text = `[${formatUTCTimestamp()}] [WARN] ${args.join(" ")}\n`;
        logs.warn += text;
        logs.info += text;
        logs.verbose += text;
    },
    // Used for anything which prevents the program from actually running.
    error(...args: any[]) {
        oldConsole.error(chalk.white.bgGray(formatTimestamp()), chalk.white.bgRed("ERROR"), ...args);
        const text = `[${formatUTCTimestamp()}] [ERROR] ${args.join(" ")}\n`;
        logs.error += text;
        logs.warn += text;
        logs.info += text;
        logs.verbose += text;
    },
    // Be as verbose as possible. If anything might help when debugging an error, then include it. This only shows in your console if you run this with "dev", but you can still get it from "logs.verbose".
    // $.debug(`core/lib::parseArgs("testing \"in progress\"") = ["testing", "in progress"]`) --> <path>/::(<object>.)<function>(<args>) = <value>
    // Would probably be more suited for debugging program logic rather than function logic, which can be checked using unit tests.
    debug(...args: any[]) {
        if (IS_DEV_MODE) oldConsole.debug(chalk.white.bgGray(formatTimestamp()), chalk.white.bgBlue("DEBUG"), ...args);
        const text = `[${formatUTCTimestamp()}] [DEBUG] ${args.join(" ")}\n`;
        logs.verbose += text;
    },
    // Used once at the start of the program when the bot loads.
    ready(...args: any[]) {
        oldConsole.log(chalk.white.bgGray(formatTimestamp()), chalk.black.bgGreen("READY"), ...args);
        const text = `[${formatUTCTimestamp()}] [READY] ${args.join(" ")}\n`;
        logs.info += text;
        logs.verbose += text;
    }
};

console.log("Loading globals...");
