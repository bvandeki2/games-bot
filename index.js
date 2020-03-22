require('dotenv').config();

const { performance } = require('perf_hooks');
const worker = require('worker_threads');

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
    console.log('Ready!');
});


const gameStartPrefix = '!countdown-game';
const bignums = [25, 50, 75, 100];
const smallnums = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

function selectWithoutReplacement(arr, n) {
    let out = [];
    for (let _ = 0; _ < n; _++) {
        const i = Math.floor(Math.random() * arr.length);
        out.push(arr[i]);
        arr = arr.slice(0, i).concat(arr.slice(i + 1));
    }

    return out;
}

function selectWithReplacement(arr, n) {
    let out = '';
    for (let _ = 0; _ < n; _++) {
        const i = Math.floor(Math.random() * arr.length);
        out += arr[i];
    }

    return out;
}

const ops = ['+', '-', '*', '/'];

function isCloseInt(n) {
    return Math.abs(Math.round(n) - n) < 1.0e-8;
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function computeCountdownSols(nums, how) {
    if (how == null) {
        how = nums.map((n) => (n).toString());
    }

    let sols = {};
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
                if (opsym === '*') result = nums[i] * nums[j];
                if (opsym === '/') result = nums[i] / nums[j];
                if (opsym === '+') result = nums[i] + nums[j];
                if (opsym === '-') result = nums[i] - nums[j];
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
                    const newNums = nums.slice(0, first).concat(nums.slice(first + 1, second)).concat(nums.slice(second + 1));
                    const newHow = how.slice(0, first).concat(how.slice(first + 1, second)).concat(how.slice(second + 1));

                    const moreSols = await computeCountdownSols(newNums.concat(result), newHow.concat(opWithNums));
                    sols = { ...moreSols, ...sols };
                }
            }
        }
    }

    return sols;
}

String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for (var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

let pot = {};

client.on('message', async message => {
    //console.log(message);

    if (message.channel.type === 'dm') {
        if (message.content.startsWith('!pot')) {
            const arg = message.content.slice('!pot'.length).trim();
            pot[message.author.id] = arg;
            await message.channel.send(`aight, got it.`);
        }
        return;
    }

    if (message.content.startsWith('!pot')) {
        const arg = message.content.slice('!pot'.length).trim();
        if (arg !== '') {
            await message.channel.send('If you\'re trying to submit to the pot, DM me instead! But if you wanted to draw,  call "!pot" with no extra arguments.');
            return;
        }
        const submitters = Object.keys(pot);
        if (submitters.length === 0) {
            await message.channel.send('The pot is empty.');
            return;
        }
        const selected = submitters[Math.floor(Math.random() * submitters.length)];

        await message.channel.send(pot[selected]);
        pot = {};
        return;

    } else if (message.content.startsWith('!letters')) {
        const args = message.content.slice('!letters'.length).split(' ');

        let vowels = 4;
        let consonants = 5;

        while (args.length > 1) {
            const command = args.shift().toLowerCase();

            if (command.trim() === '') continue;

            const param = args.shift().toLowerCase();
            if (command === '-v') {
                const num = parseInt(param);
                if (!isNaN(num) && num >= 0 && num <= 9) {
                    vowels = num;
                    consonants = 9 - vowels;
                }
            } else if (command === '-c') {
                const num = parseInt(param);
                if (!isNaN(num) && num >= 0 && num <= 9) {
                    consonants = num;
                    vowels = 9 - consonants;
                }
            } else {
                console.log(`invalid command: ${command}`)
            }
        }

        cons = 'NNNNNNRRRRRRTTTTTTLLLLSSSSDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ';
        vows = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOOUUUU';

        const s = selectWithReplacement(cons, consonants) + selectWithReplacement(vows, vowels);
        message.channel.send(s.shuffle());

    } else if (message.content.startsWith('!numbers')) {
        const args = message.content.slice('!numbers'.length).split(' ');

        let n_big = 2;
        let n_small = 4;

        while (args.length > 1) {
            const command = args.shift().toLowerCase();

            if (command.trim() === '') continue;

            const param = args.shift().toLowerCase();
            if (command === '-big') {
                const num = parseInt(param);
                if (!isNaN(num) && num >= 0 && num <= 4) {
                    n_big = num;
                    n_small = 6 - n_big;
                }
            } else if (command === '-small') {
                const num = parseInt(param);
                if (!isNaN(num) && num >= 0 && num <= 6) {
                    n_small = num;
                    n_big = 6 - n_small;
                }
            } else {
                console.log(`invalid command: ${command}`)
            }
        }

        const bigs = selectWithoutReplacement(bignums, n_big)
        const smalls = selectWithoutReplacement(smallnums, n_small);

        const all_numbers = bigs.concat(smalls);
        const target = 101 + Math.floor(899 * Math.random());

        message.channel.send(`Goal: ${target}    Numbers: ${all_numbers.join(', ')}`);

    } else if (message.content.startsWith('!solve')) {
        const args = message.content.slice('!solve'.length).replace(/, +/g, ',').split(' ');

        let all_numbers = null;
        let n = 101;

        while (args.length > 1) {
            const command = args.shift().toLowerCase();

            if (command.trim() === '') continue;

            const param = args.shift().toLowerCase();
            if (command === '-n') {
                const num = parseInt(param);
                if (!isNaN(num)) {
                    n = num
                }
            } else if (command === '-nums') {
                all_numbers = param.split(',').map((v) => parseInt(v.trim()));
            } else {
                console.log(`invalid command: ${command}`)
            }
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
        message.channel.send(selectWithReplacement(messages, 1));

        const sols = await computeCountdownSols(all_numbers);

        console.log(sols);

        let closest = null;
        for (let sol in sols) {
            if (closest === null || (Math.abs(sol - n) < Math.abs(closest - n)))
                closest = sol;
        }

        message.channel.send(`${closest} = ${sols[closest]}`);
    }
});

client.login(process.env.CLIENT_TOKEN);