module.exports = {
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.+(ts|tsx)"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    // The environment is the DOM by default, so discord.js fails to load because it's calling a Node-specific function.
    // https://github.com/discordjs/discord.js/issues/3971#issuecomment-602010271
    testEnvironment: "node"
};
