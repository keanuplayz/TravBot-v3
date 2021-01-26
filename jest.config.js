module.exports = {
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.+(ts|tsx)"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    }
};
