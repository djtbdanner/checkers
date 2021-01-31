// Where all our main socket stuff will go
const io = require('../servers').io
const Player = require('./classes/Player');
const Piece = require('./classes/Piece');
const Game = require('./classes/Game');
const ProcessMove = require('./classes/ProcessMove');

// this is all of the games being played now. Potentailly a database object
let games = [];

// opening the site will "connect", the rest will be particular "on" init, drop, etc.
io.sockets.on('connect', (socket) => {
    // console.log(socket);
    socket.on('init', (data) => {
        // console.log(JSON.stringify(data));
        let aGame = undefined;
        games.forEach((game, index) => {
            if (game.player1 && game.player2 === undefined) {
                aGame = game;
            }
        });
        let playerName = "unknown";

        playerName = data.playerName;
        if (aGame === undefined) {
            let name = playerName === "" ? "PlayerOne" : playerName;
            setUpPlayerOne(socket, name, aGame);
        } else {
            let name = playerName === "" ? "PlayerTwo" : playerName;
            setUpPlayerTwo(socket, name, aGame);
        }
    });

    // player is moving a piece
    socket.on('moving', (data) => {
        // console.log(JSON.stringify(data));
        let socketId = getGameAndOtherPlayerSocket(socket).socketId;
        //console.log(data);
        if (socketId != undefined) {
            socket.to(socketId).emit('otherPlayerMove', JSON.stringify(data));
        }
    });

    // player releases piece to make a move
    socket.on('drop', (data) => {
        // console.log(JSON.stringify(data));
        let vals = getGameAndOtherPlayerSocket(socket);
        let otherPlayerSocketId = vals.socketId;
        let game = vals.game;
        thisPlayer = game.getPlayerBySocket(socket.id); 
        otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
        let displayTurns = true;
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
                displayTurns = false;
            }
        }
        /// update board for both players - game board is updated in above process
        // thisPlayer = game.getPlayerBySocket(socket.id);
        // otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
        socket.emit('updateBoard', { player1: JSON.stringify(game.getPlayerBySocket(socket.id)), player2: JSON.stringify(otherPlayer) });
        socket.to(otherPlayerSocketId).emit('updateBoard', { player1: JSON.stringify(thisPlayer), player2: JSON.stringify(otherPlayer) });
        if (thisPlayer.winner) {
            socket.emit('flashMessage', { message: `YOU WIN!!!!` });
            socket.to(otherPlayerSocketId).emit('flashMessage', { message: `You lost this time. Better luck next time!` });
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
    });

    // player disconnects
    socket.on('disconnect', function () {
        let vals = getGameAndOtherPlayerSocket(socket);
        let otherPlayerSocketId = vals.socketId;
        let game = vals.game;

        if (game) {
            games = games.filter((g)=>{g.id !== game.id});
            thisPlayer = game.getPlayerBySocket(socket.id);
            // if there is another player, set them up, otherwise just remove the game
            if (otherPlayerSocketId){
                otherPlayer = game.getPlayerBySocket(otherPlayerSocketId);
                socket.to(otherPlayerSocketId).emit('flashMessage', { message: `Uh Oh, ${thisPlayer.name} either quit or has had some stupid network error. Game is over :(. ` });
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
    });
});

function getGameAndOtherPlayerSocket(socket) {
    let game = undefined;
    let socketId = undefined;
    games.forEach((g) =>{
        if (g.player1 && g.player1.socketId === socket.id){
            game = g;
            if (game.player2){
                socketId = game.player2.socketId;
            }
            return false;// stop the loop
        }
        if (g.player2 && g.player2.socketId === socket.id){
            game = g;
            if (game.player1){
                socketId = game.player1.socketId;
            }
            return false;// stop the loop         
        }
        return true;// continue the loop
    });
    return { game, socketId };
}

function setUpPlayerTwo(socket, playerName, aGame) {

    let player = {};
    let pieces = setUpRedPieces();
    player = new Player(socket.id, pieces, playerName);
    socket.emit('initReturn', { player: JSON.stringify(player) });
    socket.emit('initReturn', { player: JSON.stringify(aGame.player1) });
    socket.emit('flashMessage', { message: `Playing ${aGame.player1.name}, you are playing red pieces. It is ${aGame.player1.getPossesiveName()} turn first.` });
    socket.to(aGame.player1.socketId).emit('initReturn', { player: JSON.stringify(player) });
    socket.to(aGame.player1.socketId).emit('flashMessage', { message: `Playing ${player.name}, you are playing black pieces. It is your turn first.` });
    aGame.player2 = player;
    //console.log('\n\n\n' + JSON.stringify(aGame));
    // invert board for player 2 so their side is facing them
    socket.emit('invertBoard', {});
    games.push(aGame);
}

function setUpPlayerOne(socket, playerName, game) {

    let player = {};
    let pieces = setUpBlackPieces();
    player = new Player(socket.id, pieces, playerName);
    player.turn = true;
    socket.emit('initReturn', { player: JSON.stringify(player) });
    socket.emit('flashMessage', { message: `Waiting on another player to join.` });
    game = new Game(player, undefined);
    games.push(game);
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
