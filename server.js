// Since "type" is set to "module", this will add conventional node require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { command } from './classes/commands.js';
// Importing Libraries
const Discord = require("discord.js");
// Setting up Discord Bot
const client = new Discord.Client();
// Getting environment Variables
require('custom-env').env();
// Declaring Constants and Variables
const botId = "840243411562135623";
const sampaServerId = "562626870986932234";
/// Button-Related
const buttonStatusChannelId = "847013609242099742";
const buttonGeneralChannelId = "847014093583679539";
const buttonTextStatus = ["Purple", "Blue", "Green", "Yellow", "Orange", "Red"];
const buttonDelay = [10000, 9000, 8000, 6000, 4000, 2000];
let buttonTimeoutLoop;
let buttonNumericalStatus = -1;
/// Function to update the button status
function updateStatus(buttonStatusChannel) {
    // Increment button status
    buttonNumericalStatus++;
    // If button is dead, reset; else, send button status
    if (buttonNumericalStatus >= buttonTextStatus.length) {
        // Take away button roles
        const sampaGuild = client.guilds.cache.get(sampaServerId);
        sampaGuild === null || sampaGuild === void 0 ? void 0 : sampaGuild.members.fetch().then((members) => {
            members.forEach((member) => {
                buttonTextStatus.forEach((colorName) => {
                    const roleName = `${colorName} Belt`;
                    const role = sampaGuild === null || sampaGuild === void 0 ? void 0 : sampaGuild.roles.cache.find((item) => item.name === roleName);
                    member.roles.remove(role).then((value) => {
                        console.log(`Removed role for ${value.user.username}`);
                    }).catch(err => {
                        console.log(err);
                    });
                });
            });
        }).catch(err => {
            console.log(err);
        });
        // Notify Members that the button died
        const embedMessage = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`Oh no! The button is dead! Your belts have now been taken`)
            .setColor("WHITE");
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(() => {
                messageList[0].edit(embedMessage).then(_ => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel);
                });
            });
        });
        buttonNumericalStatus = -1;
    }
    else {
        const embedMessage = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`The button is now ${buttonTextStatus[buttonNumericalStatus]}`)
            .setColor(buttonTextStatus[buttonNumericalStatus].toUpperCase());
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList = [...messages.filter(msg => msg.author.id === botId).values()];
            if (messageList.length === 0) {
                buttonStatusChannel.send(embedMessage).then(_ => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel);
                });
            }
            else {
                messageList[0].edit(embedMessage).then(_ => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel);
                });
            }
        });
    }
}
// On Ready
client.on('ready', () => {
    console.log(`Bot is ready`);
    // The Button Code
    /// Getting a reference to the button status channel
    const buttonStatusChannel = client.channels.cache.get(buttonStatusChannelId);
    updateStatus(buttonStatusChannel);
});
// Setting Up "The Button" Code
// Setting up Commands
/// Test command to see if the bot is up
command(client, ["ping", "ping2"], (message) => {
    message.channel.send("Pong");
});
/// Click the button
command(client, ["button click", "bc"], (message) => {
    // Check if the user is in the right text channel
    if (message.channel.id === buttonGeneralChannelId) {
        // Change roles
        buttonTextStatus.forEach((colorName) => {
            var _a, _b;
            const roleName = `${colorName} Belt`;
            const role = (_a = message.guild) === null || _a === void 0 ? void 0 : _a.roles.cache.find((item) => item.name === roleName);
            const member = (_b = message.guild) === null || _b === void 0 ? void 0 : _b.members.cache.find((item) => item.id === message.author.id);
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
        const buttonStatusChannel = client.channels.cache.get(buttonStatusChannelId);
        const embedMessage = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`${message.author.username} has saved the button and earned a ${buttonTextStatus[buttonNumericalStatus]} belt!`)
            .setColor("WHITE");
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(() => {
                messageList[0].edit(embedMessage);
                /// Resetting the button status
                buttonNumericalStatus = -1;
                updateStatus(buttonStatusChannel);
            });
        });
    }
});
// Logging in
client.login(process.env.TOKEN);
