// Since "type" is set to "module", this will add conventional node require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Imports
import { Client, Message } from "discord.js";
const config = require("../config.json");

// A discord command
export const command = (client: Client, aliases: Array<string>, callback: (msg: Message) => void ) => {
    client.on('message', (message: Message) => {
        aliases.forEach( (alias: string): void => {

            // If the message starts with the alias or is the alias
            if( message.content.startsWith(`${config.prefix}${alias} `) || message.content === `${config.prefix}${alias}` ) {
                console.log(`Command ${alias} run.`);
                callback(message);
            }
        } )
    })
}