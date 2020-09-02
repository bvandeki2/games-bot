import { Chance } from 'chance';
import { User, DMChannel, Message, PartialMessage } from 'discord.js';
import { Command } from './command';

const chance = new Chance();

let entrants: { [author: string]: DMChannel } = {};

export class SecretSantaCommand extends Command {
  public name() {
    return 'secret-santa';
  }
  public shortDescription() {
    return 'Generate private user derangements, e.g. for secret santa';
  }

  public longDescription(prefix: string) {
    return `
In secret santa, we want to avoid a person giving themselves a gift - i.e., we want a derangement. This command generates this privately.

Examples:

DM: \`${prefix} yourname\`: register for this secret santa
Non-DM channel: \`${prefix} yourname\`: finish the secret santa; everyone gets assigned to others privately.
`;
  }

  public handler(arg: string, message: Message | PartialMessage) {
    switch (message.channel?.type) {
      case 'text':
        let tags = Object.keys(entrants);
        if (tags.length < 2) {
          message.channel.send(
            'Need at least two people to do a secret santa!'
          );
          return;
        }
        let derangement = tags.map((_, i) => i);
        let isDerangement = false;
        // Derangement ~37% = 1/e density, so just do rejection sampling
        let it = 0;
        while (!isDerangement && it < 100) {
          it++;
          derangement = chance.shuffle(derangement);
          isDerangement = true;
          for (let i = 0; i < derangement.length; i++) {
            if (derangement[i] == i) {
              isDerangement = false;
              break;
            }
          }
        }

        if (!isDerangement) {
          message.channel.send(
            'Failed to generate a derangement after 100 tries'
          );
          return;
        }

        derangement.forEach((i, j) => {
          entrants[tags[i]].send(`<@!${tags[j]}>`);
        });

        entrants = {};

        return;
      case 'dm':
        entrants[`${(message.author as User).id}`] = message.channel;
        message.channel.send(
          `Alright <@!${(message.author as User).id}>, you are entered!`
        );
        return;
      default:
        throw new Error('Channel is neither text or DM');
    }
  }
}
