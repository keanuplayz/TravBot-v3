import Command from "../core/command";

export default new Command({
    description:
        'This is a template/testing command providing common functionality. Remove what you don\'t need, and rename/delete this file to generate a fresh command file here. This command should be automatically excluded from the help command. The "usage" parameter (string) overrides the default usage for the help command. The "endpoint" parameter (boolean) prevents further arguments from being passed. Also, as long as you keep the run function async, it\'ll return a promise allowing the program to automatically catch any synchronous errors. However, you\'ll have to do manual error handling if you go the then and catch route.',
    endpoint: false,
    usage: "",
    permission: null,
    aliases: [],
    async run($) {
        // code
    },
    subcommands: {
        layer: new Command({
            description:
                'This is a named subcommand, meaning that the key name is what determines the keyword to use. With default settings for example, "$test layer".',
            endpoint: false,
            usage: "",
            permission: null,
            aliases: [],
            async run($) {
                // code
            }
        })
    },
    user: new Command({
        description:
            'This is the subcommand for getting users by pinging them or copying their ID. With default settings for example, "$test 237359961842253835". The argument will be a user object and won\'t run if no user is found by that ID.',
        endpoint: false,
        usage: "",
        permission: null,
        async run($) {
            // code
        }
    }),
    number: new Command({
        description:
            'This is a numeric subcommand, meaning that any type of number (excluding Infinity/NaN) will route to this command if present. With default settings for example, "$test -5.2". The argument with the number is already parsed so you can just use it without converting it.',
        endpoint: false,
        usage: "",
        permission: null,
        async run($) {
            // code
        }
    }),
    any: new Command({
        description:
            "This is a generic subcommand, meaning that if there isn't a more specific subcommand that's called, it falls to this. With default settings for example, \"$test reeee\".",
        endpoint: false,
        usage: "",
        permission: null,
        async run($) {
            // code
        }
    })
});
