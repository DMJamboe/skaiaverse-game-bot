const Canvas = require('canvas');
const fs = require('fs');
const db = require('../database');

class Game {
    constructor(player1, player2) {
        this.players = [new Player(player1), new Player(player2)];
        this.board = {
            z1: [],
            z2: [this.players[0], this.players[0], this.players[0], this.players[0], this.players[0], this.players[0], this.players[0]],
            z3: [],
            z4: [this.players[1]],
            z5: []
          }
        this.turn = 1;
        this.init();
        this.renderGame();
    }

    // Initialises the game
    async init() {
        // Initialises each player
        for (var player of this.players) {
            await player.init();
        }
    }

    // Renders the current game state
    async renderGame() {
        const canvas = Canvas.createCanvas(1000, 1200);
        const context = canvas.getContext("2d");
        const zones = {z1: 70, z2: 290, z3: 510, z4: 730, z5: 950};
        const baseX = 20;
        const xScale = 220;
        // Load template from images
        Canvas.loadImage("../images/chesse.png")
            .then(async (template) => {
                context.drawImage(template, 0, 0, canvas.width, canvas.height);
                context.fillStyle = "white";
                context.fillRect(0, 0, 1000, 50);
                context.fillRect(0, 1150, 1000, 50);
                context.lineWidth = 2;
                context.strokeRect(0, 50, 1000, 0);
                context.strokeRect(0, 1150, 1000, 0);
                for (const [zone, cards] of Object.entries(this.board)) {
                    console.log(1);
                    var x = baseX;
                    for (var card of cards) {
                        if (card.constructor.name == "Player") {
                            var img = await renderPlayer(card);
                        } else {
                            var img = await makeCard(card);
                        }
                        context.drawImage(img, x, zones[zone], 200, 200);
                        context.strokeRect(x, zones[zone], 200, 200);
                        x += xScale;
                    }
                }
                const buffer = canvas.toBuffer("image/png");
                fs.writeFileSync("./board.png", buffer);
                console.log("rendered");
                return canvas;
            }).catch(err => {
                console.log(err);
                return 1;
            })
    }

    // Method to draw from deck
    // 0: Success
    // 1: Invalid Player
    // 2: No cards in deck
    draw(playerID) {
        var player;
        // Checks if player is in the game
        for (var p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        if (player.deck.length == 0) {
            return 2;
        }

        // Moves top card from deck into hand
        var card = player.deck.pop();
        player.hand.push(card);
        return 0;
    }

    // Method to play card to board
    // 0: Success
    // 1: Invalid player
    // 2: Card not in hand
    playToBoard(playerID, cardname, zone) {
        var player;
        // Checks if player is in the game
        for (var p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        var selectedCard;
        var index;
        for (var card of player.hand) {
            // TEMPORARY CHANGE FOR TESTING CARDS
            //if (cardname == card.name) { 
            if (cardname == card) {
                selectedCard = card;
                index = player.hand.indexOf(card);
            }
        }

        // Error if card not in hand
        if (!selectedCard) {
            return 2;
        }

        // Removes card from hand
        player.hand.splice(index, 1);
        // Pushes card to board
        this.board[zone].push(selectedCard);

        return 0;
    }

    // Method to play spell card
    // image: Success
    // 1: Invalid player
    // 2: Card not in hand
    playSpell(playerID, cardname, zone) {
        var player;
        // Checks if player is in the game
        for (var p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        var selectedCard;
        var index;
        for (var card of player.hand) {
            // TEMPORARY CHANGE FOR TESTING CARDS
            //if (cardname == card.name) { 
            if (cardname == card) {
                selectedCard = card;
                index = player.hand.indexOf(card);
            }
        }

        // Error if card not in hand
        if (!selectedCard) {
            return 2;
        }

        // Removes card from hand
        player.hand.splice(index, 1);
        // Pushes card to grave
        player.grave.push(selectedCard);
        return 0;
        //return card.cardInfo.image; // Returns image for bot to display (?)
    }

    // Method to shuffle deck
    shuffle(playerID) {
        var player;
        // Checks if player is in the game
        for (var p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        var newdeck = shuffleArray(player.deck);
        player.deck = newdeck;

        return 0;
    }

    // Method to mulligan the deck
    mulligan(playerID) {
        var player;
        // Checks if player is in the game
        for (var p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        // Return hand to deck
        for (let i = 0; i < player.hand.length; i++) {
            let c = player.hand.pop();
            player.deck.push(c);
        }

        // Shuffle deck
        var newdeck = shuffleArray(player.deck);
        player.deck = newdeck;

        // Draw from top 5 times
        for (let i = 0; i < 5; i++) {
            let c = player.deck.pop();
            player.hand.push(c);
        }

        return 0;
    }
}



class Player{
    constructor(user) {
        this.user = user.id;
        this.name = user.username;
        this.deck = null; // Will get deck of Cards from DB
        this.grave = [];
        this.hand = [];
        this.energy = 1;
        this.maxenergy = 1;
        this.health = 25;
    }

    // Initialises a player by getting their active deck and drawing their hand
    async init() {
        const player = await db.findPlayer({userId: this.user});
        const character = await db.findCharacter({_id: player.activeCharacter});
        const deck = await db.findDeck({_id: character.activeDeck});
        var queries = []
        for (var cid of deck.cards) {
            queries.push({_id: cid});
        }
        var cards = await db.firstDocumentBatch("cards", queries);
        this.deck = cards;
        
        // Shuffle then put 5 cards into hand
        this.deck = shuffleArray(this.deck);

        // Draw from top 5 times
        for (let i = 0; i < 5; i++) {
            let c = this.deck.pop();
            this.hand.push(c);
        }
    }

}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
//https://stackoverflow.com/a/12646864
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}

// Generate a card based on its json
// TODO: add way to vertically squash long descriptions
async function makeCard(carddata) {
    const canvas = Canvas.createCanvas(500, 500);
    const context = canvas.getContext("2d");
    // Load template from images
    try {
        let template = await Canvas.loadImage("./images/" + carddata.aspect + "_Card_Template.jpg")
        context.drawImage(template, 0, 0, canvas.width, canvas.height);
        // Draw title
        context.textAlign = "right";
        context.font = 'bold 50px Georgia';
        context.fillStyle = "#ffffff";
        context.fillText(carddata.name.toUpperCase(), 478, 55, 330);
        // Draw classifications
        context.font = 'bold 36px Georgia';
        context.fillStyle = "#000000";
        //let classes = carddata.classes.join(", ");
        context.fillText(carddata.classification/*.toUpperCase()*/, 478, 92, 330);
        // Draw energy
        context.font = 'bold 40px Georgia';
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.fillText(carddata.cost, 74, 72, 56);
        // Draw range
        context.textBaseline = "middle";
        if (carddata.range) {
            context.font = 'bold 40px Georgia';
            context.fillStyle = "#5604d9";
            context.fillText(carddata.range, 437, 437, 46);
        } else {
            context.font = 'bold 50px Georgia';
            // Health
            context.fillStyle = "#ff0000";
            context.fillText(carddata.health, 437, 437, 46);
            // Atk
            context.fillStyle = "#3a3b3c";
            context.fillText(carddata.attack, 62, 437, 46);
        }

        var descSize = 36;
        var spaceSize = descSize;
        context.font = descSize + 'px Georgia';
        context.textAlign = "left";
        context.fillStyle = "#000000";
        context.textBaseline = "top";

        // Split descriptions into lines
        var cont = true;
        while (cont) {
            const boxSize = 419;
            var coords = [40, 120];
            var desc = carddata.text;
            var descArray = desc.split(" ");
            var lines = [];
            var currentLine = "";
            console.log(descArray);
            // Splits each line when it would overflow the box
            while (descArray.length != 0) {
                var nextWord = descArray.shift();
                var newLine = currentLine.concat(" ", nextWord);
                if (context.measureText(newLine).width > boxSize) {
                    if (currentLine == "") {
                        break;
                    }
                    lines.push(currentLine.trim());
                    descArray.unshift(nextWord);
                    currentLine = "";
                } else {
                    currentLine = newLine;
                }
            }
            lines.push(currentLine.trim());
            console.log(lines.length);
            // Checks whether the lines fit in the box vertically
            if (lines.length > (boxSize / descSize) / 2) {
                descSize = descSize-1;
                context.font = descSize + 'px Georgia';
                spaceSize = descSize;
            } else { 
                cont = false;
            }
        }

        // Writes to image
        for (var line of lines) {
            context.fillText(line, coords[0], coords[1]);
            coords[1] += spaceSize;
        }

        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync("./test.png", buffer);
        return canvas;
    } catch (err) {
        console.log(err);
        return 1;
    }
}

// Renders player as a card
async function renderPlayer(player) {
    const canvas = Canvas.createCanvas(500, 500);
    const context = canvas.getContext("2d");
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = 'bold 70px Georgia';
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 500 , 500);
    context.fillStyle = "#000000";
    try {
        let spiro = await Canvas.loadImage("../images/spirograph.png") // change path
        context.drawImage(spiro, 0, 0, 150, 150);
        context.fillText(player.energy, 75, 75);
        let heart = await Canvas.loadImage("../images/hearts.png") // change path
        context.drawImage(heart, 350, 350, 150, 150);
        context.fillText(player.health, 425, 425, 80);
        context.fillText(player.name, 250, 250, 500);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync("./player.png", buffer);
        console.log("returning");
        return canvas;
        } catch (err) {
            console.log(err);
            return 1;
        };
}

// 
var u1 = {id: "567732334367998004", username: "Alex"};
var u2 = {id: "567732334367998004", username: "Sam"};
var game = new Game(u1, u2);
//console.log(game.players[0].constructor.name);

module.exports = {
    makeCard: makeCard
}