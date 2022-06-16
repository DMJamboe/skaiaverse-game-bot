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

    // UNTESTED METHODS

    // Method to draw from deck
    // 0: Success
    // 1: Invalid Player
    // 2: No cards in deck
    draw(playerID) {
        var player;
        // Checks if player is in the game
        for (p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        if (deck.length == 0) {
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
        for (p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        var selectedCard;
        var index;
        for (card in player.hand) {
            if (cardname == card.name) {
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
        for (p of this.players) {
            if (p.user == playerID) {
                player = p;
            }
        }
        
        if (!player) {
            return 1;
        }

        var selectedCard;
        var index;
        for (card in player.hand) {
            if (cardname == card.name) {
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
        return card.cardInfo.image; // Returns image for bot to display (?)
    }

    // Method to shuffle deck
    shuffle(playerID) {
        var player;
        // Checks if player is in the game
        for (p of this.players) {
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
        for (p of this.players) {
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