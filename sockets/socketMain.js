// Where all our main socket stuff will go
const io = require('../servers').io
const Player = require('./classes/Player');
const Piece = require('./classes/Piece');
const Game = require('./classes/Game');
const ProcessMove = require('./classes/ProcessMove');
let games = [];

// when someone connects, hook up player or wait for another player
io.sockets.on('connect', (socket) => {
    let aGame = undefined;
    games.forEach((game, index) => {
        if (game.player1 && game.player2 === undefined) {
            aGame = game;
        }
    });
    let playerName = "unknown";
    socket.on('init', (data) => {
        let connected = true;
        playerName = data.playerName;
        if (aGame === undefined) {
            setUpPlayerOne(socket, "PLAYER ONE", aGame);
        } else {
            setUpPlayerTwo(socket, "PLAYER TWO", aGame);
        }
    });

    socket.on('moving', (data) => {
        let socketId = getGameAndOtherPlayerSocket(socket).socketId;
        //console.log(data);
        if (socketId != undefined) {
            socket.to(socketId).emit('otherPlayerMove', JSON.stringify(data));
        }
    });

    // player makes move
    socket.on('drop', (data) => {
        let vals = getGameAndOtherPlayerSocket(socket);
        let otherPlayerSocketId = vals.socketId;
        let game = vals.game;
        thisPlayer = game.getPlayerBySocket(socket.id);
        otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
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
            if (message) {
                socket.emit('flashMessage', { message: `Invalid Move:  ${message}, please try again.` });
            }
        }
        /// update board for both players - game board is updated in above process
        thisPlayer = game.getPlayerBySocket(socket.id);
        otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
        socket.emit('updateBoard', { player1: JSON.stringify(game.getPlayerBySocket(socket.id)), player2: JSON.stringify(otherPlayer) });
        socket.to(otherPlayerSocketId).emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
        if (thisPlayer.winner){
            socket.emit('flashMessage', { message: `YOU WIN!!!!` });
            socket.to(otherPlayerSocketId).emit('flashMessage', { message: `Sorry, you loose. Better luck next time!` });
        }
    });
});

function getGameAndOtherPlayerSocket(socket) {
    let game = games.find(g => g.player1.socketId === socket.id);
    let socketId;
    if (game === undefined) {
        game = games.find(g => g.player2.socketId === socket.id);
        if (game != undefined) {
            if (game.player1 != undefined) {
                socketId = game.player1.socketId;
            }
        }
    } else {
        if (game.player2 != undefined) {
            socketId = game.player2.socketId;
        }
    }
    return { game, socketId };
}

function setUpPlayerTwo(socket, playerName, aGame) {
    let pieces = [];
    let player = {};
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
    player = new Player(socket.id, pieces, playerName);
    socket.emit('initReturn', { player: JSON.stringify(player) });
    socket.emit('initReturn', { player: JSON.stringify(aGame.player1) });
    socket.emit('flashMessage', { message: `Playing ${aGame.player1.name}, you are player 2 (red).` });
    socket.to(aGame.player1.socketId).emit('initReturn', { player: JSON.stringify(player) });
    socket.to(aGame.player1.socketId).emit('flashMessage', { message: `Playing ${player.name}, you are player 1(black).` });
    aGame.player2 = player;
    //console.log('\n\n\n' + JSON.stringify(aGame));
    games.push(aGame);
}

function setUpPlayerOne(socket, playerName, game) {
    let pieces = [];
    let player = {};
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
    player = new Player(socket.id, pieces, playerName);
    player.turn = true;
    //console.log(player);
    socket.emit('initReturn', { player: JSON.stringify(player) });
    // socket.emit('flashMessage', {message:"You are player one, waiting on another player to join..."});
    game = new Game(player, undefined);
    games.push(game);
}
module.exports = io