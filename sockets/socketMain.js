// Where all our main socket stuff will go
const io = require('../servers').io
const Player = require('./classes/Player');
const Piece = require('./classes/Piece');
const Game = require('./classes/Game');
const ProcessMove = require('./classes/ProcessMove');
let games = [];

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
            playerOne(socket, playerName, aGame);
        } else {
            playerTwo(socket, playerName, aGame);
        }
    });

    socket.on('moving', (data) => {
        let socketId = getSocketIdToSend(socket).socketId;
        console.log(data);
        if (socketId != undefined) {
            socket.to(socketId).emit('otherPlayerMove', JSON.stringify(data));
        }
    });

    socket.on('drop', (data) => {
        let vals = getSocketIdToSend(socket);
        let socketId = vals.socketId;
        let game = vals.game;
        thisPlayer = game.getPlayerBySocket(socket.id);
        otherPlayer = game.getPlayerBySocket(socketId);
        if (socketId != undefined) {
            let origin = data.pieceId.replace("img_", "");
            const index = thisPlayer.pieces.findIndex(el => el.location === origin);
            let piece = undefined;
            if (index > -1) {
                piece = thisPlayer.pieces[index];
            }
            let rule = ProcessMove.isValidMove(thisPlayer, otherPlayer, origin, data.targetId, piece);
            if (rule) {
                socket.emit('flashMessage', { message: `Invalid Move:  ${rule}, please try again.` });
                socket.emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
                socket.to(socketId).emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
                return;
            }
            //validated in the isValidMove Method
            let newPiece = new Piece(piece.color, piece.king, data.targetId);
            thisPlayer.pieces[index] = newPiece;
        }

        /// update board for both players
        socket.emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
        socket.to(socketId).emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
    });
});

function getSocketIdToSend(socket) {
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

function playerTwo(socket, playerName, aGame) {
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
    games.push(aGame);
}

function playerOne(socket, playerName, game) {
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