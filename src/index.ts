import * as Discord from "discord.js";
import * as dotenv from "dotenv";
import { lettersCommand } from "./letters";
import { numbersCommand } from "./numbers";
import { potCommand } from "./pot";
import { solveNumbersCommand } from "./solve";
dotenv.config();

const client = new Discord.Client();

client.once("ready", () => {
  console.log("Ready!");
});

const PREFIX = process.env.COMMAND_PREFIX || "!gb";
const MAX_COMMAND_LENGTH =
  parseInt(process.env.MAX_COMMAND_LENGTH || "") || 255;

type CommandHandler = (
  arg: string,
  message: Discord.Message | Discord.PartialMessage
) => any;

export interface Command {
  name: string;
  handler: CommandHandler;
  shortDescription: string;
  longDescription?: string;
}

let commandMap: { [name: string]: Command | undefined } = {};

function registerCommand(command: Command): void {
  commandMap[command["name"]] = command;
}

registerCommand({
  name: "help",
  shortDescription: "Show a list of commands and their descriptions",
  handler: (detailedCmd: string, message) => {
    detailedCmd = detailedCmd.trim().toLowerCase();

    if (detailedCmd != "") {
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

      let desc = "List of available commands:\n";

      desc += keys
        .map(cmd => `${PREFIX} ${cmd}: ${commandMap[cmd]?.shortDescription}`)
        .join("\n");

      message.channel?.send(desc);
    }
  }
});

client.on("message", message => {
  // Only respond to human input
  if (message.author == null || message.author.bot) return;

  // Don't listen to things not intended for Games Bot
  if (!message.content?.startsWith(PREFIX)) return;

  if (message.content.length > MAX_COMMAND_LENGTH) return;

  const command = message.content.slice(PREFIX.length).trim();
  let firstSpace = command.indexOf(" ");

  if (firstSpace == -1) firstSpace = command.length;

  const commandName = command.slice(0, firstSpace).toLowerCase();
  const arg = command.slice(firstSpace + 1);

  const fn = commandMap[commandName]?.handler;
  if (fn) {
    fn(arg, message);
  } else {
    message.channel?.send(`Unknown command ${commandName}. Try "${PREFIX} help" for a list of commands.`);
  }
});

registerCommand(potCommand);
registerCommand(numbersCommand);
registerCommand(lettersCommand);
registerCommand(solveNumbersCommand);

client.login(process.env.CLIENT_TOKEN);
