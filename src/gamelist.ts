import { Chance } from 'chance';
import { Command } from './command';
import { DataTypes, Sequelize } from 'sequelize';
import { Message, MessageEmbed, PartialMessage } from 'discord.js';
import sequelize from 'sequelize';
import { Context } from '.';
import { stringify } from 'querystring';

const chance = new Chance();

export class GameListCommand extends Command<Context> {
  GameDescription: sequelize.ModelCtor<sequelize.Model<any, any>>;

  name() {
    return 'gamelist';
  }
  shortDescription() {
    return 'Show all games in the pool';
  }

  constructor(context: Context) {
    super(context);

    this.GameDescription = context.database.define('GameDescription', {
      // Model attributes are defined here
      gameDescription: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  }

  async initialize(context: Context) {
    await this.GameDescription.sync();
  }

  handler(arg: string, message: Message | PartialMessage) {
    let firstSpace = arg.indexOf(' ');

    if (firstSpace == -1) firstSpace = arg.length;

    const subcommand = arg.slice(0, firstSpace).toLowerCase();
    const postarg = arg.slice(firstSpace + 1);

    if (subcommand == 'list') {
      this.listGames(message);
    } else if (subcommand == 'add') {
      this.addGame(postarg, message);
    } else if (subcommand == 'random') {
      this.randomGame(message);
    } else if (subcommand == 'remove') {
      this.removeGame(postarg, message);
    } else {
      (message as Message).react('⁉️');
    }
  }

  listGames(message: Message | PartialMessage) {
    this.GameDescription.findAll().then((games) => {
      const allDescs = games.map(
        (model) => `${(model as any).id}: ${(model as any).gameDescription}`
      );
      message?.channel?.send(
        new MessageEmbed().setDescription(allDescs.join('\n'))
      );
    });
  }

  addGame(arg: string, message: Message | PartialMessage) {
    this.GameDescription.create({ gameDescription: arg }).then(() => {
      if (arg.length > 140) {
        message.channel?.send(
          `Your "game" sure has a lot of letters! To make it easier for people to read, please make your game names under 140 characters.`
        );
        return;
      }
      (message as Message).react('👍');
    });
  }

  randomGame(message: Message | PartialMessage) {
    this.GameDescription.findAll().then((games) => {
      const allDescs = games.map(
        (model) => `${(model as any).id}: ${(model as any).gameDescription}`
      );
      message?.channel?.send(
        new MessageEmbed().setDescription(allDescs.join('\n'))
      );
    });
  }

  removeGame(arg: string, message: Message | PartialMessage) {
    this.GameDescription.destroy({
      where: {
        id: parseInt(arg.trim()),
      },
    }).then(() => {
      (message as Message).react('👍');
    });
  }
}
