import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
import { lettersCommand } from './letters';
import { numbersCommand } from './numbers';
import { potCommand } from './pot';
import { solveNumbersCommand } from './solve';
import { secretSantaCommand } from './secretsanta';
import { Sequelize, DataTypes } from 'sequelize';
import { addGame, listGames, randomGame, removeGame } from './gamelist';
dotenv.config();

const client = new Discord.Client();

client.once('ready', () => {
  console.log('Ready!');
});

export const PREFIX = process.env.COMMAND_PREFIX || '!gb';

const MAX_COMMAND_LENGTH =
  parseInt(process.env.MAX_COMMAND_LENGTH || '') || 255;

interface Context {
  database: Sequelize;
}

type CommandHandler = (
  arg: string,
  message: Discord.Message | Discord.PartialMessage,
  context: Context
) => any;

export interface Command {
  name: string;
  handler: CommandHandler;
  shortDescription: string;
  longDescription?: string;
}
/** `LazyCommand` is used when you need runtime reflection of documentation, e.g. using `PREFIX` in the returned `Command`. */
export type LazyCommand = () => Command;

let commandMap: { [name: string]: Command | undefined } = {};

function registerCommand(command: Command): void {
  commandMap[command['name']] = command;
}

registerCommand({
  name: 'help',
  shortDescription: 'Show a list of commands and their descriptions',
  handler: (detailedCmd: string, message) => {
    detailedCmd = detailedCmd.trim().toLowerCase();

    if (detailedCmd != '') {
      // Show long-form details about one command in particular
      if (!(detailedCmd in commandMap)) {
        message.channel?.send(`Unknown command "${detailedCmd}"`);
        return;
      }
      message.channel?.send(
        commandMap[detailedCmd]?.longDescription ||
          `${PREFIX} ${detailedCmd}: ${commandMap[detailedCmd]?.shortDescription}`
      );
    } else {
      // No specific command of interest, show everything.
      let keys = Object.keys(commandMap);
      keys.sort();

      let desc = 'List of available commands:\n';

      desc += keys
        .map((cmd) => `${PREFIX} ${cmd}: ${commandMap[cmd]?.shortDescription}`)
        .join('\n');

      message.channel?.send(desc);
    }
  },
});

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
});

export const GameDescription = sequelize.define('GameDescription', {
  // Model attributes are defined here
  gameDescription: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

sequelize
  .authenticate()
  .then(() => GameDescription.sync())
  .then(() => {
    const context: Context = {
      database: sequelize,
    };

    client.on('message', (message) => {
      // Only respond to human input
      if (message.author == null || message.author.bot) return;

      // Don't listen to things not intended for Games Bot
      if (!message.content?.startsWith(PREFIX)) return;

      if (message.content.length > MAX_COMMAND_LENGTH) return;

      const command = message.content.slice(PREFIX.length).trim();
      let firstSpace = command.indexOf(' ');

      if (firstSpace == -1) firstSpace = command.length;

      const commandName = command.slice(0, firstSpace).toLowerCase();
      const arg = command.slice(firstSpace + 1);

      const fn = commandMap[commandName]?.handler;
      if (fn) {
        fn(arg, message, context);
      } else {
        message.channel?.send(
          `Unknown command ${commandName}. Try "${PREFIX} help" for a list of commands.`
        );
      }
    });
  });

registerCommand(potCommand());
registerCommand(secretSantaCommand());
registerCommand(numbersCommand);
registerCommand(lettersCommand);
registerCommand(solveNumbersCommand);
registerCommand(addGame);
registerCommand(randomGame);
registerCommand(listGames);
registerCommand(removeGame);

client.login(process.env.CLIENT_TOKEN);
