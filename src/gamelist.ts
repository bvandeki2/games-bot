import { Chance } from "chance";
import { Command, GameDescription } from ".";
import { Sequelize } from "sequelize";
import { Message, MessageEmbed } from "discord.js";

const chance = new Chance();

export const addGame: Command = {
  name: "add-game",
  shortDescription: "Add a game to the random game picker list!",
  handler: (arg, message, context) => {
    if (arg.length > 140) {
      message.channel?.send(`Your "game" sure has a lot of letters! To make it easier for people to read, please make your game names under 140 characters.`)
      return;
    }

    GameDescription.create({ gameDescription: arg }).then(() => {
      (message as Message).react('👍');
    });
  }
};

export const listGames: Command = {
  name: "list-games",
  shortDescription: "Show all games in the pool.",
  handler: (arg, message, context) => {
    const tags = arg.split(' ');
    
    GameDescription.findAll().then((games) => {
      const allDescs = games.map((model) => `${(model as any).id}: ${(model as any).gameDescription}`);
      message?.channel?.send(new MessageEmbed().setDescription(allDescs.join('\n')));
    });
  }
};

export const randomGame: Command = {
  name: "random-game",
  shortDescription: "Pick a game at random!",
  handler: (arg, message, context) => {
    const tags = arg.split(' ');
    
    GameDescription.findAll().then((games) => {
      const selectedGame = chance.pickone(games);
      message?.channel?.send((selectedGame as any).gameDescription);
    });
  }
};

export const removeGame: Command = {
  name: "remove-game",
  shortDescription: "Remove a game from the pool!",
  handler: (arg, message, context) => {
    
    GameDescription.destroy({
      where: {
        id: parseInt(arg.trim())
      }
    }).then(() => {
      (message as Message).react('👍');
    });
  }
};