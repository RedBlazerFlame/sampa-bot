// Since "type" is set to "module", this will add conventional node require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require("../config.json");
// A discord command
export const command = (client, aliases, callback) => {
    client.on('message', (message) => {
        aliases.forEach((alias) => {
            // If the message starts with the alias or is the alias
            if (message.content.startsWith(`${config.prefix}${alias} `) || message.content === `${config.prefix}${alias}`) {
                console.log(`Command ${alias} run.`);
                callback(message);
            }
        });
    });
};
