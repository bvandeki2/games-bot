import { Command } from ".";
import { Chance } from "chance";
const chance = new Chance();

const ops = ["+", "-", "*", "/"];

function isCloseInt(n: number) {
  return Math.abs(Math.round(n) - n) < 1.0e-8;
}

const sleep = (milliseconds: number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

async function computeCountdownSols(nums: number[], how?: string[]): Promise<string[]> {
  if (how == null) {
    how = nums.map(n => n.toString());
  }

  let sols: string[] = [];

  // This is a hacky way to let the event queue still be handled in more or less realtime
  if (nums.length > 4) {
    await sleep(1);
  }

  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i == j) continue;

      for (let op = 0; op < 4; op++) {
        const opsym = ops[op];
        //const result = parseFloat(eval(`nums[i] ${opsym} nums[j]`));
        let result = NaN;
        if (opsym === "*") result = nums[i] * nums[j];
        if (opsym === "/") result = nums[i] / nums[j];
        if (opsym === "+") result = nums[i] + nums[j];
        if (opsym === "-") result = nums[i] - nums[j];
        const opWithNums = `(${how[i]} ${opsym} ${how[j]})`;

        if (result < 0 || !isCloseInt(result)) {
          continue;
        }

        if (result < 1000) {
          // Add new solution or simplify an existing solution
          if (!(result in sols) || sols[result].length > opWithNums.length)
            sols[result] = `${opWithNums}`;
        }
        if (nums.length >= 3) {
          let first = Math.min(i, j);
          let second = Math.max(i, j);
          const newNums = nums
            .slice(0, first)
            .concat(nums.slice(first + 1, second))
            .concat(nums.slice(second + 1));
          const newHow = how
            .slice(0, first)
            .concat(how.slice(first + 1, second))
            .concat(how.slice(second + 1));

          const moreSols = await computeCountdownSols(
            newNums.concat(result),
            newHow.concat(opWithNums)
          );
          // merge new solutions into solutions array
          for(const sol of moreSols.keys()) {
            if (moreSols[sol] !== undefined) sols[sol] = moreSols[sol];
          }
        }
      }
    }
  }

  return sols;
}

export const solveNumbersCommand: Command = {
  name: "solve-numbers",
  shortDescription: "Solve the countdown numbers puzzle numerically",
  handler: async (arg, message) => {
    const args = arg.trim().replace(/, +/g, ',').split(' ');

    let all_numbers = null;
    let n = 101;

    while (args.length >= 2) {
      const command = (args.shift() as string).toLowerCase();
      const param   = (args.shift() as string).toLowerCase();

      if (command.trim() === '') continue;
        if (command === '-n') {
            const num = parseInt(param);
            if (!isNaN(num)) {
                n = num
            }
        } else if (command === '-nums') {
            all_numbers = param.split(',').map((v) => parseInt(v.trim()));
        } else {
          message.channel?.send(`Unknown parameter: ${command}`);
          return;
        }
    }

    if (all_numbers == null) {
      message.channel?.send("You need to specificy numbers.\n *Numbers! Numbers! Numbers! I cannot make bricks without clay!*");
      return;
    }

    const messages = [
        'hang on a sec there bud, this one is a bit tricky',
        'hmmm... I think you could do better.',
        'not your grandfather\'s order of operations',
        'geez, stop pestering me already',
        'c\'mon, you guys could have done this one...',
        'don\'t forget to drink water',
        '2 = 1 + 1\n oh shit that\'s the wrong one'
    ]
    message.channel?.send(chance.pickone(messages));

    const sols = await computeCountdownSols(all_numbers);

    console.log(sols);

    let closest: number | null = null;
    for (let sol of sols.keys()) {
      if (sols[sol] === undefined) continue;
      if (closest === null || (Math.abs(sol - n) < Math.abs(closest - n)))
          closest = sol;
    }

    if (closest == null) {
      message.channel?.send(`There are no integer solutions to this problem. *What did you do?*`);
      return;
    }

    message.channel?.send(`${closest} = ${sols[closest]}`);
  }
};
