// Since "type" is set to "module", this will add conventional node require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Importing Types
import { Client, Guild, Message, GuildChannel, TextChannel, MessageEmbed, Role, User, GuildMember } from "discord.js";
import { command } from './classes/commands.js';
import { Channel } from 'discord-rpc';
import { channel } from 'diagnostic_channel';
import { Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2';

// Importing Libraries
const Discord = require("discord.js");
const http = require("http");

// Setting up Discord Bot
const client: Client = new Discord.Client() as unknown as Client;

// Getting environment Variables
require('custom-env').env();

// Declaring Constants and Variables
const PORT = process.env.PORT || 4000;
const botId = "840243411562135623";
const sampaServerId = "562626870986932234";

/// Button-Related
const buttonStatusChannelId: string = "847013609242099742";
const buttonGeneralChannelId: string = "847014093583679539";
const buttonTextStatus: Array<string> = ["Purple", "Blue", "Green", "Yellow", "Orange", "Red"];
const buttonDelay: Array<number> = [5.7, 4.8, 4.3, 3.7, 3.2, 2.6].map((item: number): number => item /* 60 * 60 */* 1000);
let buttonTimeoutLoop: NodeJS.Timeout;
let buttonNumericalStatus: number = -1;
let buttonIsClickable: boolean = true;

// Setting up the web server
const httpServer: Http2Server = http.createServer((_: Http2ServerRequest, res: Http2ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Hi there :>');
    res.end();
});

/// Function to update the button status
function updateStatus(buttonStatusChannel: TextChannel): void {
    // Make the button un-clickable
    buttonIsClickable = false;

    // Increment button status
    buttonNumericalStatus++;

    // If button is dead, reset; else, send button status
    if (buttonNumericalStatus >= buttonTextStatus.length) {
        // Take away button roles
        const sampaGuild = client.guilds.cache.get(sampaServerId);
        sampaGuild?.members.fetch().then((members) => {
            // Filtering the members to only include the ones with a belt
            let filteredMembers = members.filter((member: GuildMember) => buttonTextStatus.reduce((acc: boolean, cur: string) => {
                const roleName = `${cur} Belt`;
                const role: Role = sampaGuild?.roles.cache.find((item: Role): boolean => item.name === roleName) as Role;
                return acc || member.roles.cache.has(role.id);
            }, false));

            // If there are no people with belts, call the function again
            if ([...filteredMembers].length === 0) {
                setTimeout(updateStatus, 1000, buttonStatusChannel);
            }

            [...filteredMembers.values()].forEach((member: GuildMember, memberIndex: number): void => {
                // Stores the index of the color role that the user has
                let roleIndex = 0;

                buttonTextStatus.forEach((colorName: string, index: number): void => {
                    const roleName = `${colorName} Belt`;
                    const role: Role = sampaGuild?.roles.cache.find((item: Role): boolean => item.name === roleName) as Role;
                    roleIndex = (member.roles.cache.has(role.id) ? index : roleIndex);
                    if (member.roles.cache.has(role.id)) {
                        member.roles.remove(role).then((value) => {
                            console.log(`Removed role ${roleName} for ${value.user.username}`)
                        }).catch(err => {
                            console.log(err);
                        }).finally(() => {
                            // If the person whose role was updated was the last person, call the function again
                            if ([...filteredMembers.values()].length - 1 === memberIndex) {
                                console.log("This is the last person, call next loop");
                                setTimeout((statusChannel: TextChannel) => {
                                    updateStatus(statusChannel);
                                    buttonIsClickable = true;
                                }, 1000, buttonStatusChannel);
                            }
                        });
                    }
                });

                // If the user has a blue belt or higher, give them the belt that is one level lower than their previous belt
                if (roleIndex - 1 >= 0) {
                    const roleName = `${buttonTextStatus[roleIndex - 1]} Belt`;
                    const role: Role = sampaGuild?.roles.cache.find((item: Role): boolean => item.name === roleName) as Role;
                    member.roles.add(role).then((value) => {
                        console.log(`Added role ${roleName} for ${value.user.username}`);
                    });
                }
            })
        }).catch(err => {
            console.log(err)
        });

        // Notify Members that the button died
        const embedMessage: MessageEmbed = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`Oh no! The button is dead! Your belts have now been downgraded.`)
            .setColor("WHITE");

        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList: Array<Message> = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(() => {
                messageList[0].edit(embedMessage);
            });
        })
        buttonNumericalStatus = -1;
    }
    else {
        console.log(`The button is now ${buttonTextStatus[buttonNumericalStatus]}`);
        const embedMessage: MessageEmbed = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`The button is now ${buttonTextStatus[buttonNumericalStatus]}`)
            .setColor(buttonTextStatus[buttonNumericalStatus].toUpperCase());
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList: Array<Message> = [...messages.filter(msg => msg.author.id === botId).values()];
            if (messageList.length === 0) {
                buttonStatusChannel.send(embedMessage).then(() => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel) as unknown as NodeJS.Timeout;
                    buttonIsClickable = true;
                });

            }
            else {
                messageList[0].edit(embedMessage).then(() => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel) as unknown as NodeJS.Timeout;
                    buttonIsClickable = true;
                });
            }
        })
    }
}

// On Ready
client.on('ready', () => {
    console.log(`Bot is ready`);

    // The Button Code
    /// Getting a reference to the button status channel
    const buttonStatusChannel: TextChannel = client.channels.cache.get(buttonStatusChannelId) as TextChannel;

    updateStatus(buttonStatusChannel);
});


// Setting up Commands
/// Test command to see if the bot is up
command(client, ["ping", "ping2"], (message: Message): void => {
    message.channel.send("Pong");
});

/// Click the button
command(client, ["button click", "bc"], (message: Message): void => {
    // Check if the user is in the right text channel and if the button is clickable
    if (message.channel.id !== buttonGeneralChannelId) {
        message.channel.send("This is the wrong text channel to use this command. Please go to #button-general so that you can use this command. Thank you :>");
    }
    else if (! buttonIsClickable) {
        message.channel.send("It seems like SampaBot is still processing some information (may take up to a few seconds). Please wait for him to finish before clicking the button again :>")
    }
    else {
        buttonIsClickable = false;
        // Reset the Button status
        clearTimeout(buttonTimeoutLoop);
        console.log(buttonTimeoutLoop);

        // Change roles
        let newRoleColor = buttonTextStatus[buttonNumericalStatus];
        buttonTextStatus.forEach((colorName: string): void => {
            const roleName = `${colorName} Belt`;
            const role: Role = message.guild?.roles.cache.find((item: Role): boolean => item.name === roleName) as Role;
            const member: GuildMember = message.guild?.members.cache.find((item: GuildMember): boolean => item.id === message.author.id) as GuildMember;

            // Check if the current color is the same as the color that is being checked for
            if (colorName === newRoleColor) {
                member.roles.add(role);
            }
            else {
                if (member.roles.cache.has(role.id)) {
                    member.roles.remove(role);
                }
            }
        });

        // Tell the user that he got the button
        message.channel.send(`Congratulations, ${message.author.username}! You got a ${newRoleColor} belt!`);
        console.log(`Congratulations, ${message.author.username}! You got a ${newRoleColor} belt!`);

        /// Getting a reference to the button status channel
        const buttonStatusChannel: TextChannel = client.channels.cache.get(buttonStatusChannelId) as TextChannel;

        const embedMessage: MessageEmbed = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`${message.author.username} has saved the button and earned a ${newRoleColor} belt!`)
            .setColor("WHITE");

        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList: Array<Message> = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(_ => {
                messageList[0].edit(embedMessage).then(_ => {
                    /// Resetting the button status
                    buttonNumericalStatus = -1;
                    updateStatus(buttonStatusChannel);
                });
            });
        });
    }
})

// Set Button status
command(client, ["button set"], (message: Message) => {
    const newColor = [message.content.split(" ").slice(3).join(" ").charAt(0).toUpperCase(), ...message.content.split(" ").slice(3).join(" ").slice(1)].join("");
    
    // The index of the new state
    const buttonNewStateIndex: number = buttonTextStatus.findIndex((color: string): boolean => color === newColor);

    if(! message.member?.roles.cache.has(message.guild?.roles.cache.find((role: Role) => (role?.name || "") === `Moderator`).id)) {
        message.channel.send("You have to have the moderator role to run this command!");
    }
    else if(! buttonIsClickable)
    {
        message.channel.send("SampaBot is currently processing information. Please try re-running the command in a few seconds.");
    }
    else if(buttonNewStateIndex === -1) {
        message.channel.send("That is an invalid color. Did you accidentally add trailing spaces?");
    }
    else
    {
        // Tell the user that the button has been updated
        message.channel.send(`The button is now ${newColor}`);

        // Make the button un-clickable
        buttonIsClickable = false;

        // Stop the button clock
        clearTimeout(buttonTimeoutLoop);

        /// Getting a reference to the button status channel
        const buttonStatusChannel: TextChannel = client.channels.cache.get(buttonStatusChannelId) as TextChannel;

        // Update Button Status
        buttonNumericalStatus = buttonNewStateIndex - 1;
        updateStatus(buttonStatusChannel);
    }
})

// Logging in
client.login(process.env.TOKEN);

// Listening to a certain port
httpServer.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})