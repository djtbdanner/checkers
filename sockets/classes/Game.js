const { v4: uuidv4 } = require('uuid');
class Game{
    constructor(player1,player2){
        this.id = uuidv4();
        this.player1 = player1;
        this.player2 = player2;
    }

    getPlayerBySocket (socketid){
        if (this.player1 && this.player1.socketId === socketid){
            return this.player1;
        }
        if (this.player2 && this.player2.socketId === socketid){
            return this.player2;
        }
    }
}
module.exports = Game