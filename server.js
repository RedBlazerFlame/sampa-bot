// Since "type" is set to "module", this will add conventional node require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { command } from './classes/commands.js';
// Importing Libraries
const Discord = require("discord.js");
const http = require("http");
// Setting up Discord Bot
const client = new Discord.Client();
// Getting environment Variables
require('custom-env').env();
// Declaring Constants and Variables
const PORT = process.env.PORT || 4000;
const botId = "840243411562135623";
const sampaServerId = "562626870986932234";
/// Button-Related
const buttonStatusChannelId = "847013609242099742";
const buttonGeneralChannelId = "847014093583679539";
const buttonTextStatus = ["Purple", "Blue", "Green", "Yellow", "Orange", "Red"];
const buttonDelay = [6, 5, 4, 3, 3, 2].map((item) => item * 60 * 60 * 1000);
let buttonTimeoutLoop;
let buttonNumericalStatus = -1;
let buttonIsClickable = true;
// Setting up the web server
const httpServer = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Hi there :>');
    res.end();
});
/// Function to update the button status
function updateStatus(buttonStatusChannel) {
    // Make the button un-clickable
    buttonIsClickable = false;
    // Increment button status
    buttonNumericalStatus++;
    // If button is dead, reset; else, send button status
    if (buttonNumericalStatus >= buttonTextStatus.length) {
        // Take away button roles
        const sampaGuild = client.guilds.cache.get(sampaServerId);
        sampaGuild === null || sampaGuild === void 0 ? void 0 : sampaGuild.members.fetch().then((members) => {
            // Filtering the members to only include the ones with a belt
            let filteredMembers = members.filter((member) => buttonTextStatus.reduce((acc, cur) => {
                const roleName = `${cur} Belt`;
                const role = sampaGuild === null || sampaGuild === void 0 ? void 0 : sampaGuild.roles.cache.find((item) => item.name === roleName);
                return acc || member.roles.cache.has(role.id);
            }, false));
            // If there are no people with belts, call the function again
            if ([...filteredMembers].length === 0) {
                setTimeout(updateStatus, 1000, buttonStatusChannel);
            }
            [...filteredMembers.values()].forEach((member, memberIndex) => {
                // Stores the index of the color role that the user has
                let roleIndex = 0;
                buttonTextStatus.forEach((colorName, index) => {
                    const roleName = `${colorName} Belt`;
                    const role = sampaGuild === null || sampaGuild === void 0 ? void 0 : sampaGuild.roles.cache.find((item) => item.name === roleName);
                    roleIndex = (member.roles.cache.has(role.id) ? index : roleIndex);
                    if (member.roles.cache.has(role.id)) {
                        member.roles.remove(role).then((value) => {
                            console.log(`Removed role ${roleName} for ${value.user.username}`);
                        }).catch(err => {
                            console.log(err);
                        }).finally(() => {
                            // If the person whose role was updated was the last person, call the function again
                            if ([...filteredMembers.values()].length - 1 === memberIndex) {
                                console.log("This is the last person, call next loop");
                                setTimeout((statusChannel) => {
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
                    const role = sampaGuild === null || sampaGuild === void 0 ? void 0 : sampaGuild.roles.cache.find((item) => item.name === roleName);
                    member.roles.add(role).then((value) => {
                        console.log(`Added role ${roleName} for ${value.user.username}`);
                    });
                }
            });
        }).catch(err => {
            console.log(err);
        });
        // Notify Members that the button died
        const embedMessage = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`Oh no! The button is dead! Your belts have now been downgraded.`)
            .setColor("WHITE");
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(() => {
                messageList[0].edit(embedMessage);
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
                buttonStatusChannel.send(embedMessage).then(() => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel);
                    buttonIsClickable = true;
                });
            }
            else {
                messageList[0].edit(embedMessage).then(() => {
                    buttonTimeoutLoop = setTimeout(updateStatus, buttonDelay[buttonNumericalStatus], buttonStatusChannel);
                    buttonIsClickable = true;
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
// Setting up Commands
/// Test command to see if the bot is up
command(client, ["ping", "ping2"], (message) => {
    message.channel.send("Pong");
});
/// Click the button
command(client, ["button click", "bc"], (message) => {
    // Check if the user is in the right text channel and if the button is clickable
    if (message.channel.id !== buttonGeneralChannelId) {
        message.channel.send("This is the wrong text channel to use this command. Please go to #button-general so that you can use this command. Thank you :>");
    }
    else if (!buttonIsClickable) {
        message.channel.send("It seems like SampaBot is still processing some information (may take up to a few seconds). Please wait for him to finish before clicking the button again :>");
    }
    else {
        buttonIsClickable = false;
        // Reset the Button status
        clearTimeout(buttonTimeoutLoop);
        console.log(buttonTimeoutLoop);
        // Change roles
        let newRoleColor = buttonTextStatus[buttonNumericalStatus];
        buttonTextStatus.forEach((colorName) => {
            var _a, _b;
            const roleName = `${colorName} Belt`;
            const role = (_a = message.guild) === null || _a === void 0 ? void 0 : _a.roles.cache.find((item) => item.name === roleName);
            const member = (_b = message.guild) === null || _b === void 0 ? void 0 : _b.members.cache.find((item) => item.id === message.author.id);
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
        const buttonStatusChannel = client.channels.cache.get(buttonStatusChannelId);
        const embedMessage = new Discord.MessageEmbed()
            .setTitle("**Button Status**")
            .setDescription(`${message.author.username} has saved the button and earned a ${newRoleColor} belt!`)
            .setColor("WHITE");
        buttonStatusChannel.messages.fetch().then((messages) => {
            let messageList = [...messages.filter(msg => msg.author.id === botId).values()];
            buttonStatusChannel.send(embedMessage).then(_ => {
                messageList[0].edit(embedMessage).then(_ => {
                    /// Resetting the button status
                    buttonNumericalStatus = -1;
                    updateStatus(buttonStatusChannel);
                });
            });
        });
    }
});
// Logging in
client.login(process.env.TOKEN);
// Listening to a certain port
httpServer.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
