import { Chance } from 'chance';
import { Message, PartialMessage } from 'discord.js';
import { Command } from './command';

const chance = new Chance();

const cons = [...'NNNNNNRRRRRRTTTTTTLLLLSSSSDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ'];
const vows = [...'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOOUUUU'];

export class LettersCommand extends Command {
  public name() {
    return 'countdown-letters';
  }
  public shortDescription() {
    return 'Generate random letters for playing a game of Countdown';
  }

  public handler(arg: string, message: Message | PartialMessage) {
    const args = arg.split(' ');

    let vowelCount = 4;
    let consonantCount = 5;

    while (args.length >= 2) {
      const command = (args.shift() as string).toLowerCase();
      const param = (args.shift() as string).toLowerCase();

      if (command.trim() === '') continue;
      if (command === '-v') {
        const num = parseInt(param);
        if (!isNaN(num) && num >= 0 && num <= 9) {
          vowelCount = num;
          consonantCount = 9 - vowelCount;
        }
      } else if (command === '-c') {
        const num = parseInt(param);
        if (!isNaN(num) && num >= 0 && num <= 9) {
          consonantCount = num;
          vowelCount = 9 - consonantCount;
        }
      } else {
        message.channel?.send(`Unknown parameter: ${command}`);
        return;
      }
    }

    let s = '';

    for (let i = 0; i < vowelCount; i++) {
      s += chance.pickone(vows);
    }

    for (let i = 0; i < consonantCount; i++) {
      s += chance.pickone(cons);
    }

    message.channel?.send(chance.shuffle([...s]).join(''));
  }
}
