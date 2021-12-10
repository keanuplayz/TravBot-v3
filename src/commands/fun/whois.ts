import {User} from "discord.js";
import {Command, NamedCommand, getUserByNickname, RestCommand} from "onion-lasers";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";

// Quotes must be used here or the numbers will change
export const registry: {[id: string]: string} = {
    "465662909645848577": "You're an idiot, that's what.",
    "306499531665833984":
        "Kuma, you eldritch fuck, I demand you to release me from this Discord bot and let me see my Chromebook!",
    "137323711844974592": "The purple haired gunner man who makes loud noises.",
    "208763015657553921": "Minzy's master.",
    "229636002443034624": "The ***God*** of being Smug.",
    "280876114153308161": "The best girl.",
    "175823837835821067": "The somehow sentient pear.",
    "145839753118351360": "The blueberry with horns.",
    "173917366504259585": "A talented developer.",
    "216112465321263105": "The red strawberry cat.",
    "394808963356688394": "The cutest, bestest, most caring girl ever.",
    "142200534781132800": "The masters of chaos.",
    "186496078273708033": "The cute blue cat.",
    "241293368267767808": "The cute catgirl.",
    "540419616803913738": "The generically Generic hologram man.",
    "157598993298227211": "The somehow sentient bowl of nachos.",
    "225214401228177408": "The CMD user.",
    "224619540263337984": "The guy that did 50% of the work.",
    "374298111255773184": "The cutest fox around.",
    "150400803503472640": "The big huggy turtle boye.",
    "620777734427115523": "The small huggy turtle boye.",
    "310801870048198667": "An extremely talented artist and modder.",
    "328223274133880833": "The stealthiest hitman.",
    "219661798742163467": "An extremely talented artist and modder.",
    "440399719076855818":
        "You are, uhh, Stay Put, Soft Puppy, Es-Pee, Swift Pacemaker, Smug Poyo, and many more.\n...Seriously, this woman has too many names.",
    "243061915281129472":
        "Some random conlanger, worldbuilder and programmer doofus. ~~May also secretly be a nyan. :3~~",
    "792751612904603668":
        "Some random nyan. :3 ~~May also secretly be a conlanger, worldbuilder and programmer doofus.~~",
    "367439475153829892": "A weeb.",
    "760375501775700038": "˙qǝǝʍ ∀",
    "389178357302034442": "In his dreams, he is the star. its him. <:itsMe:808174425253871657>",
    "606395763404046349": "Me.",
    "237359961842253835": "Good question.",
    "320680803124248576":
        "The resident meat lump and certified non-weeb. Inquire directly for details and keep that honey glaze to yourself.",
    "689538764950994990":
        "The slayer of memes, a vigilante of the voidborn, and the self-proclaimed prophet of Xereptheí.\n> And thus, I shall remain dormant once more. For when judgement day arrives, those whose names are sung shall pierce the heavens.",
    "273599683132260354":
        "Does memes, art crimes, programming, programming accessories, and is accessory to meme, programming, and art crimes. Also, tiny potato.",
    "156532969119547393": "Someone pretty cool for a bird made out of fire.",
    "388522171393245184": "The bat. Likes pats. If mean, apply whacks. 🗞️",
    "138840343855497216": "your face is a whois entry"
};

export const header = new SlashCommandBuilder()
    .setDescription("Tells you who the specified user is")
    .addUserOption((option) =>
        option.setName("target").setDescription("The person to inquire about").setRequired(true)
    );

export function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    const user = options.getUser("target", true);
    const id = user.id;

    if (id in registry) {
        interaction.reply({content: `${user} ${registry[id]}`, allowedMentions: {parse: []}});
    } else {
        interaction.reply({content: `${user} hasn't been added to the registry yet!`, allowedMentions: {parse: []}});
    }
}

export default new NamedCommand({
    description: "Tells you who you or the specified user is.",
    aliases: ["whoami"],
    async run({send, author}) {
        const id = author.id;

        if (id in registry) {
            send({content: `${author} ${registry[id]}`, allowedMentions: {parse: []}});
        } else {
            send("You haven't been added to the registry yet!");
        }
    },
    id: "user",
    user: new Command({
        async run({send, args}) {
            const user: User = args[0];
            const id = user.id;

            if (id in registry) {
                send({content: `${user} ${registry[id]}`, allowedMentions: {parse: []}});
            } else {
                send({content: `${user} hasn't been added to the registry yet!`, allowedMentions: {parse: []}});
            }
        }
    }),
    any: new RestCommand({
        async run({send, guild, combined}) {
            const user = await getUserByNickname(combined, guild);

            if (typeof user !== "string") {
                if (user.id in registry) {
                    send({content: `${user} ${registry[user.id]}`, allowedMentions: {parse: []}});
                } else {
                    send({content: `${user} hasn't been added to the registry yet!`, allowedMentions: {parse: []}});
                }
            } else {
                send(user);
            }
        }
    })
});
