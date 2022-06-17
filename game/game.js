const Canvas = require('canvas');
const fs = require('fs')

class Game {
    constructor(player1, player2) {
        this.players = [new Player(player1), new Player(player2)];
        this.board = {
            z1: [],
            z2: [],
            z3: [],
            z4: [],
            z5: []
          }
        this.turn = 1
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
function makeCard(carddata) {
    const canvas = Canvas.createCanvas(500, 500);
    const context = canvas.getContext("2d");
    // Load template from images
    Canvas.loadImage("../images/" + carddata.aspect + "_Card_Template.jpg")
        .then((template) => {
            context.drawImage(template, 0, 0, canvas.width, canvas.height);
            // Draw title
            context.textAlign = "right";
            context.font = '46px Georgia';
            context.fillStyle = "#ffffff";
            context.fillText(carddata.name.toUpperCase(), 478, 50, 330);
            // Draw classifications
            context.font = '40px Georgia';
            context.fillStyle = "#000000";
            let classes = carddata.classes.join(", ");
            context.fillText(classes.toUpperCase(), 478, 90, 330);
            // Draw energy
            context.textAlign = "center";
            context.fillStyle = "#d4af37";
            context.fillText(carddata.cost["$numberInt"], 74, 72, 56);
            // Draw range
            context.font = '50px Georgia';
            if (carddata.range) {
                context.fillStyle = "#a32cc4";
                context.fillText(carddata.range, 437, 453, 46);
            } else {
                // Health
                context.fillStyle = "#dc143c";
                context.fillText(carddata.health["$numberInt"], 439, 456, 46);
                // Atk
                context.fillStyle = "#5B5C5D";
                context.fillText(carddata.attack["$numberInt"], 64, 456, 46);
            }

            context.font = '26px Georgia';
            context.textAlign = "left";
            context.fillStyle = "#000000";

            // Split descriptions into lines
            const boxSize = 433;
            var coords = [33, 140];
            var desc = carddata.text;
            var descArray = desc.split(" ");
            var lines = [];
            var currentLine = "";
            console.log(descArray);
            while (descArray.length != 0) {
                var nextWord = descArray.shift();
                var newLine = currentLine.concat(" ", nextWord);
                if (context.measureText(newLine).width > boxSize) {
                    lines.push(currentLine.trim());
                    descArray.unshift(nextWord);
                    currentLine = "";
                } else {
                    currentLine = newLine;
                }
            }
            lines.push(currentLine.trim());

            for (var line of lines) {
                context.fillText(line, coords[0], coords[1]);
                coords[1] += 26;
            }

            const buffer = canvas.toBuffer("image/png");
            fs.writeFileSync("./test.png", buffer);
        }).catch(err => {
            console.log(err);
            return 1;
        })
    //canvas.toBuffer("image/png");
}

/* Testing
var u1 = {id: 123, username: "Alex"};
var u2 = {id: 274, username: "Sam"};
var game = new Game(u1, u2);
game.players[0].deck = ["Flume Knight", "Toothpaste", "Teleport", "Swift Attack", "Atrioc's Gambit"];
// Testing draw
game.draw(123);
game.draw(123);
console.log(game.players[0]);
// Testing play to board
console.log(game.playToBoard(123, "Swift Attack", "z2"));
console.log(game.playToBoard(321, "Swift Attack", "z2"));
console.log(game.playToBoard(274, "Swift Attack", "z2"));
console.log(game.players[0]);
console.log(game.board);
// Testing play as spell
console.log(game.playSpell(123, "Atrioc's Gambit"));
console.log(game.players[0]);
// Testing shuffle
console.log(game.players[0]);
game.shuffle(123);
console.log(game.players[0]);
*/

/*fs.readFile("../images/" + carddata.aspect + "_Card_Template.jpg", (err, data) => {
        if (err) {
            return 1;
        }
        templateFile = data;
    }) */

var carddata = { "_id":{"$oid":"62ab3fbd1e90cf6a2e7c1ca0"},
             "name":"One Trillion Lions",
             "classes":["Denizen", "Spell", "Lion"],
             "text":"One trillion!",
             "cost":{"$numberInt":"999"},
             "attack":{"$numberInt":"999"},
             "health":{"$numberInt":"999"},
             "range":null,
             "aspect":"Breath",
             "image":null };
makeCard(carddata);

