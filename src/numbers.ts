import { Chance } from "chance";
import { Command } from ".";

const chance = new Chance();

const bignums = [25, 50, 75, 100];
const smallnums = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

export const numbersCommand: Command = {
  name: "countdown-numbers",
  shortDescription: "Generate random numbers for playing a game of Countdown",
  handler: (arg, message) => {
    const args = arg.trim().split(' ');

    let bigCount = 2;
    let smallCount = 4;

    while (args.length >= 2) {
      const command = (args.shift() as string).toLowerCase();
      const param   = (args.shift() as string).toLowerCase();

      if (command.trim() === '') continue;

      if (command === '-big') {
        const num = parseInt(param);
        if (!isNaN(num) && num >= 0 && num <= 4) {
          bigCount = num;
          smallCount = 6 - bigCount;
        }
      } else if (command === '-small') {
        const num = parseInt(param);
        if (!isNaN(num) && num >= 2 && num <= 6) {
          smallCount = num;
          bigCount = 6 - smallCount;
        }
      } else {
        message.channel?.send(`Unknown parameter: ${command}`);
        return;
      }
    }

    const bigs = chance.pickset(bignums, bigCount)
    const smalls = chance.pickset(smallnums, smallCount);

    const allNumbers = bigs.concat(smalls);
    const target = chance.integer({
      min: 101,
      max: 999
    });

    message.channel?.send(`Goal: ${target}    Numbers: ${allNumbers.join(', ')}`);
  }
};
