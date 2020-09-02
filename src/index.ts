import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
import { LettersCommand } from './letters';
import { NumbersCommand } from './numbers';
import { PotCommand } from './pot';
import { SolveNumbersCommand } from './solve';
import { SecretSantaCommand } from './secretsanta';
import { Sequelize, DataTypes } from 'sequelize';
import { GameListCommand } from './gamelist';
import { CommandHandler } from './command';

dotenv.config();
const client = new Discord.Client();

client.once('ready', () => {
  console.log('Ready!');
});
export interface Context {
  database: Sequelize;
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
});

const context: Context = {
  database: sequelize,
};

const commandClasses = [
  PotCommand,
  SecretSantaCommand,
  NumbersCommand,
  LettersCommand,
  SolveNumbersCommand,
  GameListCommand,
];
const commands = commandClasses.map(
  (CommandClass) => new CommandClass(context)
);

const handler = new CommandHandler(context, process.env['PREFIX'] || '!gb');

sequelize
  .authenticate()
  .then(() => {
    return Promise.all(commands.map((c) => c.initialize(context)));
  })
  .then(() => {
    commands.forEach((c) => handler.registerCommand(c));
    client.on('message', (m) => handler.handleMessage(m));
  });

client.login(process.env.CLIENT_TOKEN);
