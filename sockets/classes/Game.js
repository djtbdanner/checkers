const { v4: uuidv4 } = require('uuid');
class Game {
    constructor(player1, player2) {
        this.id = uuidv4();
        this.player1 = player1;
        this.player2 = player2;
    }

    getPlayerBySocket(socketid) {
        if (this.player1 && this.player1.socketId === socketid) {
            return this.player1;
        }
        if (this.player2 && this.player2.socketId === socketid) {
            return this.player2;
        }
    }

    resetTurn() {
        this.player1.turn = !this.player1.turn;
        this.player2.turn = !this.player2.turn;
    }

    getOtherPlayer(player) {
        if (player.id) {
            if (this.player1.id === player.id) {
                if (this.player2) {
                    return this.player2;
                }
            }
            if (this.player1) {
                return this.player1;
            }
        }
        return undefined;
    }

    allPieces() {
        let pieces = [];
        if (this.player1 && this.player1.pieces) {
            pieces.push.apply(pieces, this.player1.pieces);
        }
        if (this.player2 && this.player2.pieces) {
            pieces.push.apply(pieces, this.player2.pieces);
        }
        return pieces;
    }
}
module.exports = Game