import * as Discord from 'discord.js';

const MAX_COMMAND_LENGTH =
  parseInt(process.env.MAX_COMMAND_LENGTH || '') || 255;

export abstract class Command<Context = {}> {
  constructor(context: Context) {}
  async initialize(context: Context): Promise<any> {}
  abstract name(): string;
  abstract handler(
    arg: string,
    message: Discord.Message | Discord.PartialMessage,
    context: Context
  ): void;
  abstract shortDescription(): string;

  longDescription(prefix: string): string | null {
    return null;
  }
}

export class CommandHandler<Context> {
  commandMap: { [name: string]: Command | Command<Context> } = {};
  context: Context;
  prefix: string;

  constructor(context: Context, prefix: string = '!gb') {
    this.context = context;
    this.prefix = prefix;
  }

  public registerCommand(command: Command | Command<Context>): void {
    this.commandMap[command.name()] = command;
  }

  public handleMessage(message: Discord.Message | Discord.PartialMessage) {
    // Only respond to human input
    if (message.author == null || message.author.bot) return;

    // Don't listen to things not intended for Games Bot
    if (!message.content?.startsWith(this.prefix)) return;

    if (message.content.length > MAX_COMMAND_LENGTH) return;

    const command = message.content.slice(this.prefix.length).trim();
    let firstSpace = command.indexOf(' ');

    if (firstSpace == -1) firstSpace = command.length;

    const commandName = command.slice(0, firstSpace).toLowerCase();
    const arg = command.slice(firstSpace + 1);

    if (commandName == 'help') {
      this.help(arg, message);
      return;
    }
    const commandObject = this.commandMap[commandName];
    if (commandObject) {
      commandObject.handler(arg, message, this.context);
    } else {
      message.channel?.send(
        `Unknown command ${commandName}. Try "${this.prefix} help" for a list of commands.`
      );
    }
  }

  help(arg: string, message: Discord.Message | Discord.PartialMessage) {
    arg = arg.trim().toLowerCase();

    if (arg != '') {
      // Show long-form details about one command in particular
      if (!(arg in this.commandMap)) {
        message.channel?.send(`Unknown command "${arg}"`);
        return;
      }
      message.channel?.send(
        this.commandMap[arg]?.longDescription(this.prefix) ||
          `${this.prefix} ${arg}: ${this.commandMap[arg]?.shortDescription()}`
      );
    } else {
      // No specific command of interest, show everything.
      let keys = Object.keys(this.commandMap);
      keys.sort();

      let desc = 'List of available commands:\n';

      desc += keys
        .map(
          (cmd) =>
            `${this.prefix} ${cmd}: ${this.commandMap[cmd]?.shortDescription()}`
        )
        .join('\n');

      message.channel?.send(desc);
    }
  }
}
