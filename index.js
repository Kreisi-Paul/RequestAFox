const fs = require("fs");
const path = require("path");
const https = require("https");
const {Client, Events, GatewayIntentBits} = require('discord.js');
const {token, db_foxes, fox_channel, clientId} = require('./config.json');
const commands = Object.keys(db_foxes);
const imgDB = JSON.parse(fs.readFileSync(path.resolve("img.json")));

let tmpAllPics = 0;

const imgDBinfo = new Object();
for(let i=0,iLength=Object.keys(imgDB).length; i<iLength; i++) {
	imgDBinfo[Object.keys(imgDB)[i]] = Object.values(imgDB[Object.keys(imgDB)[i]]).length;

	tmpAllPics += Object.values(imgDBinfo)[i];
}

let tmpStats = "";
for(let i=0,iLength=Object.keys(imgDBinfo).length,iObj=Object.keys(imgDBinfo).sort(); i<iLength; i++) {
	tmpStats += `${iObj[i]}: ${imgDBinfo[iObj[i]]} images\n`;
}
tmpStats += `total images: ${tmpAllPics}`;
const imgDBstats = tmpStats;
delete tmpStats;

let tmpCommandInfo = "";
for(let i=0,iLength=commands.length,iArray=commands.sort(); i<iLength; i++) {
	tmpCommandInfo += `/${iArray[i]}\n`
}
tmpCommandInfo += "/random_fox\n\n";
tmpCommandInfo += "/fox_stats\n";
tmpCommandInfo += "/fox_commands\n";

const commandInfo = tmpCommandInfo;
delete tmpCommandInfo;

const categoryShare = new Array();
let tmpShareAdjust = 0;
for(let i=0,iLength=Object.keys(imgDBinfo).length; i<iLength; i++) {
	
	let tmpShare = imgDBinfo[Object.keys(imgDBinfo)[i]] / tmpAllPics;
	categoryShare.push([Object.keys(imgDBinfo)[i],tmpShare + tmpShareAdjust]);
	tmpShareAdjust += tmpShare;
}
//console.log(JSON.stringify(categoryShare))
delete tmpShareAdjust;
delete tmpAllPics;



// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag} at ${Date.now()}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if(interaction.channelId == fox_channel) {
		if(interaction.type == 2) {
			try {
				if(commands.includes(interaction.commandName) || interaction.commandName == "random_fox") {
					let response = getRandomImage(interaction.commandName);

						let msg = await interaction.reply({
							"content":response[0]
						});

						let responseMsg = await interaction.fetchReply();

						if(response[1]) {
							msg.edit({"components": [{
								"type": 1,
								"components":
								[{
									"type": 2,
									"label": "Categorize",
									"style": 5,
									"url": `https://www.kreisi.net/foxposting?img=${encodeURIComponent(response[0])}&msg=${responseMsg.id}`
								}]
							}]});
						}
						else {
							msg.edit({"components": [{
								"type": 1,
								"components":
								[{
									"type": 2,
									"label": "Report",
									"style": 5,
									"url": `https://www.kreisi.net/foxposting?img=${encodeURIComponent(response[0])}&msg=${responseMsg.id}`
								}]
							}]});
						}

				}
				else if(interaction.commandName == "fox_stats") {
					interaction.reply(imgDBstats);
				}
				else if(interaction.commandName == "fox_commands") {
					interaction.reply(commandInfo);
				}
			}
			catch (e){console.log(e)}
		}
	}
	else
		interaction.reply({"content":`Wrong Channel! Please use <#${fox_channel}> to use this bot.`,"ephemeral":true});
});

// Log in to Discord with your client's token
client.login(token);

function getRandomImage(foxType) {
	let foxName;
	let isUncategorized = false;

	if(foxType == "random_fox") {
		let randomIndex = Math.random();
		//console.log(randomIndex)
		//console.log(categoryShare)

		for(let i=0,j=1,iLength=categoryShare.length; i<iLength; i++) {
			if(categoryShare[i][1] > randomIndex) {
				foxName = categoryShare[j][0];
				if(foxName == "Uncategorized")
					isUncategorized = true;
				break;
			}
			j = i+1;
		}
	}
	else
		foxName = db_foxes[foxType].name;

	let randomIndex = Math.round(Math.random() * (imgDBinfo[foxName]-1));
	//console.log(foxName,randomIndex)
	return [imgDB[foxName][randomIndex][0],isUncategorized];
}



const serverOptions = {
	key: fs.readFileSync(path.resolve("key.pem")),
	cert: fs.readFileSync(path.resolve("cert.pem"))
}

https.createServer(serverOptions, async (req, res) => {

	res.setHeader("Access-Control-Allow-Origin","https://www.kreisi.net");

	let requestParams = new URLSearchParams(req.url)
	//console.log(requestParams)

	if(requestParams.get("/categorize?img") && requestParams.get("cat")) {
		try {
			let tmpDB = JSON.parse(fs.readFileSync(path.resolve("categorize.json")));

			tmpDB.push(
				{
					img:requestParams.get("/categorize?img"),
					cat:requestParams.get("cat"),
					ip: req.headersDistinct["x-forwarded-for"][0]
				}
			);
			fs.writeFileSync("categorize.json",JSON.stringify(tmpDB, null, 4));
			res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
			res.end("");	
		}
		catch {
			res.writeHead(500, {"Content-Type": "application/json; charset=utf-8"});
			res.end("");			
		}
	}
	else if(req.url == "/getimage") {
		let randomIndex = Math.round(Math.random() * (imgDBinfo.Uncategorized-1));
		let response = imgDB.Uncategorized[randomIndex][0];

		res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
		res.end(response);
	}
	else if(requestParams.get("/reportimage?img")) {
		try {
			let reportDB = JSON.parse(fs.readFileSync(path.resolve("reported.json")));
			reportDB.push({"img":requestParams.get("/reportimage?img"),"reason":"not_fox","ip":req.headersDistinct["x-forwarded-for"][0]});
			fs.writeFileSync("reported.json",JSON.stringify(reportDB, null , "\t"));

			res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
			res.end("");
		}
		catch {
			res.writeHead(500, {"Content-Type": "application/json; charset=utf-8"});
			res.end("");
		}

		try {
			if(requestParams.get("msg")) {
				let msg = await client.channels.cache.get(fox_channel).messages.fetch(requestParams.get("msg"));
				if(msg.content == requestParams.get("/reportimage?img") && msg.author.id == clientId)
					msg.delete();
			}
		}
		catch(err) {console.error(err)}
	}
	else {
		res.writeHead(400, {"Content-Type": "application/json; charset=utf-8"});
		res.end("");
	}
}).listen(8083);
