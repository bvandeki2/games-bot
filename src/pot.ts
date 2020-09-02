import { Chance } from 'chance';
import { User } from 'discord.js';
import { LazyCommand, PREFIX } from '.';

const chance = new Chance();

let pot: { [author: string]: string } = {};

export const potCommand: LazyCommand = () => ({
  name: 'pot',
  shortDescription: 'Enter into/draw from a pot for random drawings',
  longDescription: `
The \`pot\` command allows multiple users to put an anonymous message into the "pot" by DMing me.
This can then be drawn from publicly without revealing anyone's name.

Examples:

DM: \`${PREFIX} pot sometext\`: send "sometext" into the pot.
Non-DM channel: \`${PREFIX} pot\`: pull a single submission from the pot, and then clear it.
Non-DM channel: \`${PREFIX} pot -all\`: pull all submissions from the pot (in a random order), and then clear it.
  `,
  handler: (arg, message) => {
    switch (message.channel?.type) {
      case 'text':
        const all = arg.trim() === '-all';
        if (arg !== '' && !all) {
          message.channel.send(
            `If you\'re trying to submit to the pot, DM me instead! But if you wanted to draw,  call "${PREFIX} pot" with no extra arguments.`
          );
          return;
        }
        // Select someone at random and show their submission anonymously
        const submitters = Object.keys(pot);
        if (submitters.length === 0) {
          message.channel.send('The pot is empty.');
          return;
        }

        if (all) {
          const allSubmissions = chance
            .shuffle(submitters)
            .map((s) => pot[s])
            .join('\n');
          message.channel.send(
            `Here's what everyone said (in a random order, of course):\n${allSubmissions}`
          );
        } else {
          const selected = chance.pickone(submitters);
          message.channel.send(pot[selected]);
        }

        // clear pot for next time
        pot = {};
        return;
      case 'dm':
        if (arg === '') {
          message.channel.send(
            `\`pot\` command requires text to submit, e.g. \`${PREFIX} pot sometext\``
          );
          return;
        }
        // Author is validated to be non-null in index.ts
        pot[(message.author as User).id] = arg;
        message.channel.send(`aight, got it.`);
        return;
      default:
        throw new Error('Channel is neither text or DM');
    }
  },
});
