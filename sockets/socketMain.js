// The primary socket processing on server side
const io = require('../servers').io
const Player = require('./classes/Player');
const Piece = require('./classes/Piece');
const Game = require('./classes/Game');
const ProcessMove = require('./classes/ProcessMove');

// this is all of the games being played now. Potentailly a database object
let games = [];
// all the players waiting to be selected or select another player
let players = [];

// opening the site will "connect", the rest will be particular "on" init, drop, etc.
io.sockets.on('connect', (socket) => {
    console.log("initial connection ");
    socket.on('initGame', (data) => {
        try {
            let game = getGameAndOtherPlayerSocket(socket).game;
            let playerOne;
            let playerTwo;
            if (game) {
                games = games.filter((g) => { g.id !== game.id; });
                playerOne = game.getPlayerBySocket(socket.id);
                if (playerOne) {
                    playerTwo = game.getOtherPlayer(playerOne);
                }
                socket.emit('resetInvert', {});
            } else {
                playerOne = players.find((p) => { return p.socketId === socket.id });
                playerTwo = players.find((p) => { return p.id === data.playerTwoId });
            }

            if (!playerTwo || !playerOne) {
                socket.emit('flashMessage', { message: `Looks like the player has left the game, you click home on the menu to find another player.` });
                return;
            }
            // line up boards for replay
            socket.emit('resetInvert', {});
            socket.to(playerTwo.socketId).emit('resetInvert', {});
            let aGame = new Game(playerOne, playerTwo);
            games.push(aGame);

            playerOne.pieces = setUpBlackPieces();
            playerOne.turn = true;
            playerOne.winner = false;
            playerOne.decending = true;
            playerTwo.pieces = setUpRedPieces();
            playerTwo.turn = false;
            playerTwo.winner = false;
            playerTwo.decending = !playerOne.decending;
            players = players.filter((p) => { return p.id !== playerOne.id });
            players = players.filter((p) => { return p.id !== playerTwo.id });
            console.log(`Game Begins :  ${JSON.stringify(aGame)}`);
            socket.emit('initGameReturn', { player: JSON.stringify(playerOne), otherPlayer: JSON.stringify(playerTwo) });
            socket.to(playerTwo.socketId).emit('initGameReturn', { player: JSON.stringify(playerTwo), otherPlayer: JSON.stringify(playerOne) });

            socket.emit('flashMessage', { message: `Playing ${playerTwo.name}, you are playing black pieces. It is your turn first.` });
            socket.to(playerTwo.socketId).emit('flashMessage', { message: `Playing ${playerOne.name}, you are playing red pieces. It is ${playerOne.getPossesiveName()} turn first.` });
            // invert board for player 2 so their side is facing them
            socket.to(playerTwo.socketId).emit('invertBoard', {});
        } catch (error) {
            handleError(socket, error, data);
        }
    });

    // player is moving a piece
    socket.on('moving', (data) => {
        try {
            // console.log(JSON.stringify(data));
            let socketId = getGameAndOtherPlayerSocket(socket).socketId;
            //console.log(data);
            if (socketId != undefined) {
                socket.to(socketId).emit('otherPlayerMove', JSON.stringify(data));
            }
        } catch (error) {
            handleError(socket, error, data);
        }
    });

    // player releases piece to make a move
    socket.on('drop', (data) => {
        try {
            let vals = getGameAndOtherPlayerSocket(socket);
            let otherPlayerSocketId = vals.socketId;
            let game = vals.game;
            // the listener on phone/tablet can send drop before game starts
            if (!game){
                 return;
            }
            thisPlayer = game.getPlayerBySocket(socket.id);
            otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
            let displayTurns = true;
            let kinged = false;
            if (otherPlayerSocketId != undefined) {
                let origin = data.pieceId.replace("img_", "");
                const index = thisPlayer.pieces.findIndex(el => el.location === origin);
                let piece = undefined;
                if (index > -1) {
                    piece = thisPlayer.pieces[index];
                }
                vals = ProcessMove.validateAndProcessPlayerMove(game, thisPlayer, origin, data.targetId);
                game = vals.game;
                let message = vals.message;
                kinged = vals.kinged;
                if (message) {
                    socket.emit('flashMessage', { message: `Invalid Move:  ${message}.` });
                    displayTurns = false;
                }
            }
            let sound = "tap";
            if (kinged) {
                sound = "king";
            }
            socket.emit('updateBoard', { player1: JSON.stringify(game.getPlayerBySocket(socket.id)), player2: JSON.stringify(otherPlayer) });
            socket.to(otherPlayerSocketId).emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
            socket.emit('playSound', { sound });
            socket.to(otherPlayerSocketId).emit('playSound', { sound });
            if (thisPlayer.winner) {
                const playAgainThisPlayer = `<br><br><a href="#" onclick="initGame('${otherPlayer.id}')" class="login_button">Play ${otherPlayer.name} again...</a>`;
                const playAgainOtherPlayer = `<br><br><a href="#" onclick="initGame('${thisPlayer}')" class="login_button">Play ${thisPlayer.name} again...</a>`
                socket.emit('flashMessage', { message: `YOU WIN!!!! ${playAgainThisPlayer}` });
                socket.emit('playSound', { sound: `cheer` });
                socket.to(otherPlayerSocketId).emit('playSound', { sound: `fail` });
                socket.to(otherPlayerSocketId).emit('flashMessage', { message: `You lost this time. Better luck next time! ${playAgainOtherPlayer}` });
            } else {
                if (displayTurns) {

                    if (thisPlayer.turn) {
                        socket.emit('flashMessage', { message: `Your turn.` });
                        socket.to(otherPlayerSocketId).emit('flashMessage', { message: `${thisPlayer.getPossesiveName()} turn.` });
                    } else {
                        socket.emit('flashMessage', { message: `${otherPlayer.getPossesiveName()} turn.` });
                        socket.to(otherPlayerSocketId).emit('flashMessage', { message: `Your turn.` });
                    }
                }
            }
        } catch (error) {
            handleError(socket, error, data);
        }
    });

    // player joins player pool to choose or be choosen
    socket.on('joinPool', function (data) {
        try {
            console.log(`join pool: ${JSON.stringify(data)}`)
            let playerName = data.playerName || randomNameGenerator();
            playerName = replaceBadWordFilter(playerName);
            const playerId = data.playerId;
            let player;
            if (playerId) {
                player = players.find((p) => {
                    return p.id === playerId;
                });
                if (!player) {
                    player = new Player(socket.id, undefined, playerName, playerId);
                    players.push(player);
                }
            } else {
                player = new Player(socket.id, undefined, playerName);
                players.push(player);
            }
            players.sort((a, b) => a.name.localeCompare(b.name));
            socket.emit('joinPoolReturn', { player: JSON.stringify(player), players: JSON.stringify(players) });
        } catch (error) {
            handleError(socket, error, data);
        }
    });

    // player disconnects
    socket.on('disconnect', function () {
        try {
            let vals = getGameAndOtherPlayerSocket(socket);
            let otherPlayerSocketId = vals.socketId;
            let game = vals.game;

            // console.log(JSON.stringify(players));
            console.log(`Removing player with socket ${socket.id} from list of players`);
            players = players.filter((p) => { return p.socketId !== socket.id });
            console.log(JSON.stringify(players));

            if (game) {
                console.log(`Removing ${game.id} from list of games`);
                games = games.filter((g) => { g.id !== game.id });
                const thisPlayer = game.getPlayerBySocket(socket.id);
                // if there is another player, set them up, otherwise just remove the game
                if (otherPlayerSocketId) {
                    otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
                    socket.to(otherPlayerSocketId).emit('flashMessage', { message: `Uh Oh, ${thisPlayer.name} has disconnected. You can navigate to the Home page to try and connect with another player. ` });
                    game.removePlayers();
                    otherPlayer.pieces = setUpBlackPieces();
                    otherPlayer.turn = true;
                    otherPlayer.decending = true;
                    otherPlayer.winner = false;
                    game.player1 = otherPlayer;
                    socket.to(otherPlayerSocketId).emit('reInitReturn', { player: JSON.stringify(otherPlayer) });
                    game = new Game(otherPlayer, undefined);
                    games.push(game);
                }
            }
        } catch (error) {
            handleError(socket, error, "disconnect");
        }
    });
});

function getGameAndOtherPlayerSocket(socket) {
    let game = undefined;
    let socketId = undefined;
    games.forEach((g) => {
        if (g.player1 && g.player1.socketId === socket.id) {
            game = g;
            if (game.player2) {
                socketId = game.player2.socketId;
            }
            return false;// stop the loop
        }
        if (g.player2 && g.player2.socketId === socket.id) {
            game = g;
            if (game.player1) {
                socketId = game.player1.socketId;
            }
            return false;// stop the loop         
        }
        return true;// continue the loop
    });
    return { game, socketId };
}

module.exports = io;

function setUpBlackPieces() {
    let pieces = [];
    for (i = 8; i > 5; i--) {
        for (ii = 1; ii < 9; ii++) {
            if (i % 2 === 0) {
                if (ii % 2 != 0) {
                    let piece = new Piece("B", false, i + "_" + ii);
                    pieces.push(piece);
                }
            } else {
                if (ii % 2 === 0) {
                    let piece = new Piece("B", false, i + "_" + ii);
                    pieces.push(piece);
                }
            }
        }
    }
    return pieces;
}

function setUpRedPieces() {
    let pieces = [];
    for (i = 1; i < 4; i++) {
        for (ii = 1; ii < 9; ii++) {
            if (i % 2 === 0) {
                if (ii % 2 != 0) {
                    let piece = new Piece("R", false, i + "_" + ii);
                    pieces.push(piece);
                }
            } else {
                if (ii % 2 === 0) {
                    let piece = new Piece("R", false, i + "_" + ii);
                    pieces.push(piece);
                }
            }
        }
    }
    return pieces;
}

function randomNameGenerator(num) {
    let res = '';
    if (!num) {
        num = 8;
    }
    for (let i = 0; i < num; i++) {
        const random = Math.floor(Math.random() * 26);
        res += String.fromCharCode(97 + random);
    };
    res = res.charAt(0).toUpperCase() + res.slice(1);
    return res;
};

function replaceBadWordFilter(name) {
    badOnes = ["anal",
        "anus",
        "arse",
        "ass",
        "ballsack",
        "balls",
        "bastard",
        "bitch",
        "biatch",
        "bloody",
        "blowjob",
        "blow job",
        "bollock",
        "bollok",
        "boner",
        "boob",
        "bugger",
        "bum",
        "butt",
        "buttplug",
        "clitoris",
        "cock",
        "coon",
        "crap",
        "cunt",
        "damn",
        "dick",
        "dildo",
        "dyke",
        "fag",
        "feck",
        "fellate",
        "fellatio",
        "felching",
        "fuck",
        "f u c k",
        "fudgepacker",
        "fudge packer",
        "flange",
        "Goddamn",
        "God damn",
        "hell",
        "homo",
        "jerk",
        "jizz",
        "knobend",
        "knob end",
        "labia",
        "lmao",
        "lmfao",
        "muff",
        "nigger",
        "nigga",
        "omg",
        "penis",
        "piss",
        "poop",
        "prick",
        "pube",
        "pussy",
        "queer",
        "scrotum",
        "sex",
        "shit",
        "s hit",
        "sh1t",
        "slut",
        "smegma",
        "spunk",
        "tit",
        "tosser",
        "turd",
        "twat",
        "vagina",
        "wank",
        "whore",
        "wtf"];

    let response = name;
    const bads = badOnes.filter(v => { return name.toLowerCase().includes(v); });
    if (bads && bads.length > 0) {
        response = name.toLowerCase();
        bads.forEach(bad => {
            response = response.replace(bad, randomNameGenerator(bad.length));
        });
        console.log(`attempt to clean ${name}, converted to ${response}`);
    }
    return response;
};

function handleError(socket, error, data) {
    try {
        console.log(`ERROR: ${error} - DATA: ${JSON.stringify(data)} - STACK: ${error.stack}`);
        console.error(error);
        let errorMessage = `A stupid error happened in processing. Not something we expected. If the server didn't go down, you may want to just start over. Sorry!`
        if (socket) {
            socket.emit('backendError', errorMessage);
        }
    } catch (e) {
        // dont' shut down if error handling error
        console.log(e);
    }
}