class Piece{
    constructor(color,king,location){
        this.color = color;
        this.king = king;
        this.location = location;
        this.decending = "R" === color;
        this.additionalSequencialJump = false;
    }
}

module.exports = Piece