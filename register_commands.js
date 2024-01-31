const { REST, Routes } = require('discord.js');
const { clientId, guildId, token, db_foxes } = require('./config.json');
let commands = new Array();


for(let i=0,iLength=Object.keys(db_foxes).length; i<iLength; i++) {
    commands.push(
        {
            options: [],
            name: Object.keys(db_foxes)[i],
            name_localizations: undefined,
            description: `Responds with a picture of a ${db_foxes[Object.keys(db_foxes)[i]].name}`,
            description_localizations: undefined,
            default_permission: undefined,
            default_member_permissions: undefined,
            dm_permission: undefined,
            nsfw: undefined
        }
    );
}

commands.push(
    {
        options: [],
        name: "random_fox",
        name_localizations: undefined,
        description: "Responds with random fox picture",
        description_localizations: undefined,
        default_permission: undefined,
        default_member_permissions: undefined,
        dm_permission: undefined,
        nsfw: undefined
    }
);
commands.push(
    {
        options: [],
        name: "fox_stats",
        name_localizations: undefined,
        description: "Responds with stats about this bot",
        description_localizations: undefined,
        default_permission: undefined,
        default_member_permissions: undefined,
        dm_permission: undefined,
        nsfw: undefined
    }
);
commands.push(
    {
        options: [],
        name: "fox_commands",
        name_localizations: undefined,
        description: "Responds with a list of commands for this bot",
        description_localizations: undefined,
        default_permission: undefined,
        default_member_permissions: undefined,
        dm_permission: undefined,
        nsfw: undefined
    }
);
console.log(commands)


const rest = new REST().setToken(token);
rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: commands }
);