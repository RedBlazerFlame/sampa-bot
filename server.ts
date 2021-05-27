// Since "type" is set to "module", this will add conventional node require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Importing Types
import { Client, Guild, Message, GuildChannel, TextChannel, MessageEmbed, Role, User, GuildMember } from "discord.js";
import { command } from './classes/commands.js';
import { Channel } from 'discord-rpc';
import { channel } from 'diagnostic_channel';

// Importing Libraries
const Discord = require("discord.js");

// Setting up Discord Bot
const client: Client = new Discord.Client() as unknown as Client;

// Getting environment Variables
require('custom-env').env();

// Declaring Constants and Variables
const botId = "840243411562135623";
const sampaServerId = "562626870986932234";

/// Button-Related
const buttonStatusChannelId: string = "847013609242099742";
const buttonGeneralChannelId: string = "847014093583679539";
const buttonTextStatus: Array<string> = ["Purple", "Blue", "Green", "Yellow", "Orange", "Red"];
const buttonDelay: Array<number> = [10000, 9000, 8000, 6000, 4000, 2000];
let buttonTimeoutLoop: NodeJS.Timeout;
let buttonNumericalStatus: number = -1;

/// Function to update the button status
function updateStatus(buttonStatusChannel: TextChannel): void {
    // Increment button status
    buttonNumericalStatus++;

    // If button is dead, reset; else, send button status
    if (buttonNumericalStatus >= buttonTextStatus.length) {
        // Take away button roles
        const sampaGuild = client.guilds.cache.get(sampaServerId);
        sampaGuild?.members.fetch().then((members) => {
            members.forEach((member: GuildMember): void => {
                buttonTextStatus.forEach((colorName: string): void => {
                    const roleName = `${colorName} Belt`;
                    const role: Role = sampaGuild?.roles.cache.find((item: Role): boolean => item.name === roleName) as Role;
                    member.roles.remove(role).then((value) => {
                        console.log(`Removed role for ${value.user.username}`)
                    }).catch(err => {
                        console.log(err);
                    });
                });
            })
        }).catch(err => {
            console.log(err)
        });

        // Notify Members that the button died
        const embedMessage: MessageEmbed = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`Oh no! The button is dead! Your belts have now been taken`)
            .setColor("WHITE");

        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList: Array<Message> = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(() => {
                messageList[0].edit(embedMessage).then(_ => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel) as unknown as NodeJS.Timeout;
                });

            });
        })
        buttonNumericalStatus = -1;
    }
    else {
        const embedMessage: MessageEmbed = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`The button is now ${buttonTextStatus[buttonNumericalStatus]}`)
            .setColor(buttonTextStatus[buttonNumericalStatus].toUpperCase());
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList: Array<Message> = [...messages.filter(msg => msg.author.id === botId).values()];
            if (messageList.length === 0) {
                buttonStatusChannel.send(embedMessage).then(_ => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel) as unknown as NodeJS.Timeout;
                });
            }
            else {
                messageList[0].edit(embedMessage).then(_ => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel) as unknown as NodeJS.Timeout;
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

// Setting Up "The Button" Code


// Setting up Commands
/// Test command to see if the bot is up
command(client, ["ping", "ping2"], (message: Message): void => {
    message.channel.send("Pong");
});

/// Click the button
command(client, ["button click", "bc"], (message: Message): void => {
    // Check if the user is in the right text channel
    if (message.channel.id === buttonGeneralChannelId) {
        // Change roles
        buttonTextStatus.forEach((colorName: string): void => {
            const roleName = `${colorName} Belt`;
            const role: Role = message.guild?.roles.cache.find((item: Role): boolean => item.name === roleName) as Role;
            const member: GuildMember = message.guild?.members.cache.find((item: GuildMember): boolean => item.id === message.author.id) as GuildMember;

            // Check if the current color is the same as the color that is being checked for
            if (colorName === buttonTextStatus[buttonNumericalStatus]) {
                member.roles.add(role);
            }
            else {
                member.roles.remove(role);
            }
        });

        // Tell the user that he got the button
        message.channel.send(`Congratulations, ${message.author.username}! You got a ${buttonTextStatus[buttonNumericalStatus]} belt!`);

        // Reset the Button status
        clearTimeout(buttonTimeoutLoop);

        /// Getting a reference to the button status channel
        const buttonStatusChannel: TextChannel = client.channels.cache.get(buttonStatusChannelId) as TextChannel;

        const embedMessage: MessageEmbed = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`${message.author.username} has saved the button and earned a ${buttonTextStatus[buttonNumericalStatus]} belt!`)
            .setColor("WHITE");

        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList: Array<Message> = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(() => {
                messageList[0].edit(embedMessage);

                /// Resetting the button status
                buttonNumericalStatus = -1;
                updateStatus(buttonStatusChannel);
            });
        });
    }
})

// Logging in
client.login(process.env.TOKEN);