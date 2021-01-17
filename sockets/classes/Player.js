// this is where ALL the data is stored about a given player
const { v4: uuidv4 } = require('uuid');
class Player{
    constructor(socketId, pieces, name){
        this.id= uuidv4();
        this.socketId = socketId;
        this.pieces = pieces;
        this.name = name;
        this.turn = false;
        // decending true if start at the 8th row.
        this.decending = true;
        if (pieces && pieces[0].color === 'B'){
            this.decending = false;
        }
    }
}

module.exports = Player