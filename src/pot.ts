import { Chance } from "chance";
import { User } from "discord.js";
import { Command } from ".";

const chance = new Chance();

let pot: { [author: string]: string } = {};

export const potCommand: Command = {
  name: "pot",
  shortDescription: "Enter into a pot for random drawings",
  handler: (arg, message) => {
    switch (message.channel?.type) {
      case "text":
        if (arg !== "") {
          message.channel.send(
            'If you\'re trying to submit to the pot, DM me instead! But if you wanted to draw,  call "pot" with no extra arguments.'
          );
          return;
        }
        // Select someone at random and show their submission anonymously
        const submitters = Object.keys(pot);
        if (submitters.length === 0) {
          message.channel.send("The pot is empty.");
          return;
        }
        const selected = chance.pickone(submitters);
        message.channel.send(pot[selected]);

        // clear pot for next time
        pot = {};
        return;
      case "dm":
        if (arg === "") {
          message.channel.send(
            '"pot" command requires text to submit, e.g. "pot sometext"'
          );
          return;
        }
        // Author is validated to be non-null in index.ts
        pot[(message.author as User).id] = arg;
        message.channel.send(`aight, got it.`);
        return;
      default:
        throw new Error("Channel is neither text or DM");
    }
  }
};
