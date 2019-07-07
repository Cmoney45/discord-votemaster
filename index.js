const private = require('./private.js');
const Discord = require('discord.js');
const client = new Discord.Client();
const Poll = require("./controller/Poll");

const defaults = {
	timeout: 1,
	color: 2555834,
	triggers: {newPoll: '!newpoll', vote: '!vote', results: '!results'},
	appName: 'Votemaster'
};

let polls = new Map();

function generateDiscordEmbed(poll, type) {
	let embed = {}, choiceList = ``, resultsList = ``;
	poll.choices.forEach((choice, key) => {
		choiceList += `${choice.emoji} - ${choice.name} \n`;
		resultsList += `***${choice.votes} votes*** \n`;
	});

	switch(type) {
		case 'poll':
			embed = {
				title: `Poll ${poll.id}: ${poll.name}`,
				description: `To vote, reply with\`!vote choice\` within the next ${poll.timeout} minutes. For example, "!vote ${poll.choices.keys().next().value}". If multiple polls are open, you\'ll have to specify which one using its number and a pound sign: \`!vote #${poll.id} choice\`.`,
				color: poll.color,
				timestamp: poll.timeCreated,
				footer: {
					text: poll.footNote
				},
				author: {
					name: defaults.appName
				},
				fields: [{
					name: `Choices:`,
					value: choiceList
				}]
			};
			break;
		case 'results':
			//TODO: Order choices in results based on number of votes

			embed = {
				title: `*Results* - Poll ${poll.id}: ${poll.name}`,
				description: poll.open ? `This poll is still open, so these results may change.` : `This poll has closed and cannot be voted on.`,
				color: poll.color,
				timestamp: new Date(),
				footer: {
					text: `For more detailed results, use the \`--users\` flag.`
				},
				author: {
					name: defaults.appName
				},
				fields: [{
					name: `Choices:`,
					value: choiceList,
					inline: true
				}, {
					name: `Results:`,
					value: resultsList,
					inline: true
				}]
			};
			break;
		case 'detailResults':
			//TODO: Order choices in results based on number of votes

			embed = {
				title: `*Results* - Poll ${poll.id}: ${poll.name}`,
				description: poll.open ? `This poll is still open, so these results may change.` : `This poll has closed and cannot be voted on.`,
				color: poll.color,
				timestamp: new Date(),
				footer: {
					text: `We don't have detailed results capability yet.`
				},
				author: {
					name: defaults.appName
				},
				fields: [{
					name: `Choices:`,
					value: choiceList,
					inline: true
				}, {
					name: `Results:`,
					value: resultsList,
					inline: true
				}]
			};
	}

	return embed;
}

client.on('ready', () => {
	console.log('I am ready!');
});

client.on('message', message => {
	if(message.content) {
		// Array with: anything in brackets, anything in quotes, anything separated by spaces (in that hierarchy)
		let args = message.content.trim().match(/(?:[^\s"\[]+|\[[^\[]*\]|"[^"]*")+/g);
		if(args[0].toLowerCase() === defaults.triggers.newPoll) {
			args.shift();
			// Do a little format checking to make sure (first argument, title, should be in quotes, and second argument, choices, should be in brackets)
			if(
				args.length > 1 &&
				args[0].charAt(0) === '"' &&
				args[0].charAt(args[0].length - 1) === '"' &&
				args[1].charAt(0) === '[' &&
				args[1].charAt(args[1].length - 1) === ']'
			) {
				
				// Title of the poll, without quotes
				let title = args.shift().slice(1,-1);
				// Array of poll choices, trimmed
				let choices = args.shift().slice(1,-1).split(',').map(Function.prototype.call, String.prototype.trim);
				let options = {
					name: title,
					choices: choices,
					emojiType: 'letters',
					timeout: defaults.timeout,
					color: defaults.color,
					arguments: {},
					role: false,
					notes: '',
					server: message.guild
				};

				// args should now just have the arguments
				args.forEach((arg, index) => {
					// If it's a new argument (starts with '--')
					if(arg.charAt(0) === '-' && arg.charAt(1) === '-') {

						// Remove '--'
						arg = arg.slice(2);

						if(arg === 'time' || arg === 'timeout') {
							let nextEl = args[index + 1];
							// If the next element is a nunber
							if(!isNaN(nextEl) && nextEl > 0) {
								options.timeout = +nextEl;
								args.slice(index + 1, 1);
							} else {
								let errorMessage = `A timeout argument was found, but the next item was not a valid number, so the poll defaulted to ${defaults.timeout} minutes. `;
								console.warn(errorMessage);
								options.notes += errorMessage;
							}

						} else if(arg === 'color' || arg === 'colour') {
							let nextEl = args[index + 1];
							// If the next element is a valid RGB int code
							if(!isNaN(nextEl) && +nextEl >= 0 && +nextEl <= 256*256*256) {
								options.color = +nextEl;
								args.slice(index + 1, 1);
							} else {
								let errorMessage = `A color argument was found, but the next item was not an RGB int code, so this was ignored.`;
								console.warn(errorMessage);
								options.notes += errorMessage;
							}

						} else if(arg === 'role') {
							let nextEl = args[index + 1];
							// If the next element is surrounded by double quotes
							if(args.find(el => el == 'rxn' || el === 'reactions')) {
								let errorMessage = `A "role" argument was found, but the reactions option was enabled, so voting can't be restricted to roles.`;
								console.warn(errorMessage);
								footNote += errorMessage;
							} else if(nextEl.charAt(0) === '"' && nextEl.charAt(nextEl.length - 1) === '"') {
								options.role = nextEl.slice(1, -1);
								args.slice(index + 1, 1);
							} else {
								let errorMessage = `A "role" argument was found, but the next item was not a string surrounded by "double quotes", so this was ignored. `;
								console.warn(errorMessage);
								options.notes += errorMessage;
							}

						} else if(arg === 'numbers' || arg === 'num') {
							if(choices.length <= emoji.numbers.length) {
								options.emojiType = 'numbers';
							} else {
								let errorMessage = `The poll was requested to be displayed with number icons, but there are only ten icons and ${choices.length} options were specified, so this was ignored. `;
								console.warn(errorMessage);
								options.notes += errorMessage;
							}

						} else if(arg === 'yesno' || arg === 'yn') {
							if(choices.length <= emoji.yn.length) {
								options.emojiType = 'yn';
							} else {
								let errorMessage = `The poll was requested to be displayed with yes/no icons, but too many (${choices.length}) options were specified, so this was ignored. `;
								console.warn(errorMessage);
								options.notes += errorMessage;
							}

						} else {
							options.arguments[arg] = true;
						}
					}
				});

				let newPoll = new Poll(options);
				newPoll.startTimer();
				polls.set(newPoll.id, newPoll);

				let embed = generateDiscordEmbed(newPoll, 'poll');
				message.channel.send('OK, here\'s your poll:', {embed});

			} else {
				console.error("Message format was invalid.");
				message.channel.send(`Poll requests must at minimum include a title (in "double quotes") and a set of options (in [square brackets], separated by commas). For example, try \`${defaults.triggers.newPoll} "What is your favorite shade of red?" [dark red, medium red, light red]\`.`);
			}

		} else if(args[0].toLowerCase() == defaults.triggers.vote) {
			args.shift();

			let activePollsInServer = [], voteResponse;
			polls.forEach(poll => {
				if(poll.open && poll.server == message.guild) {
					activePollsInServer.push(poll.id);
				}
			});

			if(activePollsInServer.length === 0) {
				voteResponse = `There aren't any active polls in this server right now, so you can't vote.`;

			} else if(args[0].charAt(0) !== '#') {
				// Only the vote was supplied
				if(activePollsInServer.length === 1) {
					voteResponse = polls.get(activePollsInServer[0]).vote(args[0].toLowerCase(), message.author).message;
				} else {
					// TODO dynamic examples
					voteResponse = 'Sorry, I don\'t know which poll to vote on. Please specify the poll id number using a pound sign and a number (ie \'!vote #1 A\') before your vote.';
				}

			} else {
				// The ID and vote were supplied
				let pollID = +(args[0].substr(1));

				if(activePollsInServer.includes(pollID)) {
					voteResponse = polls.get(pollID).vote(args[1].toLowerCase(), message.author).message;
				} else {
					// TODO dynamic examples
					voteResponse = 'Sorry, that\'s not a valid poll to vote on. Please specify the poll id number (ie \'!vote #1 A\') before your vote.';
				}
	 		}

	 		message.channel.send(voteResponse);

	 	} else if(args[0].toLowerCase() == defaults.triggers.results) {
	 		args.shift();

	 		let response;

	 		if(args[0].charAt(0) !== '#') { 
	 			message.channel.send('Sorry, I don\'t know which poll to get results for. Please specify the poll id number using a pound sign and number (ie \'!results #1\').');
	 		} else {
	 			let pollID = +(args[0].substr(1));

	 			if(polls.get(pollID)) {
	 				let embed;
	 				if(args[1] && (args[1].slice(2) === 'detailed' || args[1].slice(2) === 'users')) {
	 					embed = generateDiscordEmbed(polls.get(pollID), 'detailResults');
	 				} else {
	 					embed = generateDiscordEmbed(polls.get(pollID), 'results');
	 				}
	 				
	 				message.channel.send('OK, here\'s the results:', {embed});
	 			} else {
	 				message.channel.send('Sorry, that poll doesn\'t seem to exist.');
	 			}
	 		}

	 	} else if(args[0].toLowerCase() == '!pollping') {
	 		message.channel.send('PONG!'); //for testing connection
	 	}
	}
});

client.login(private.token);