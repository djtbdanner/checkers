// this is where ALL the data is stored about a given player
const crypto = require("crypto");
class Player{
    constructor(socketId, pieces, name, id){
        if (!id){
            this.id = crypto.randomBytes(16).toString("hex");;
        } else {
            this.id = id;
        }
        this.socketId = socketId;
        this.pieces = pieces;
        this.name = name;
        this.turn = false;
        // decending true if start at the 8th row.
        this.decending = false;
        if (pieces && pieces[0].color === 'B'){
            this.decending = true;
        }
        this.winner = false;
    }

    getPossesiveName(){
        if (this.name && this.name.endsWith('s')){
            return `${this.name}'`;
        }
        return `${this.name}'s`;
    }
}

module.exports = Player