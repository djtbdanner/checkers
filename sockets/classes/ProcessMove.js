const Piece = require("./Piece");

exports.isValidMove = (thisPlayer, otherPlayer, originPlace, newPlace, piece) => {
    console.log(thisPlayer);
    console.log(otherPlayer);
    console.log(originPlace);
    console.log(newPlace);
    let playerDirection = "desc";
    let pieceColor = "Black";
    if (thisPlayer.pieces.length > 0) {
        let color = thisPlayer.pieces[0].color;
        if (color.startsWith("R")) {
            pieceColor = "Red";
            playerDirection = "asc";
        }
    }

    if (!thisPlayer.turn) {
        return `it is ${otherPlayer.name}'s turn`
    }

    if (piece === undefined) {
        return `cannot move opponents pieces (your pieces are ${pieceColor})`;
    }
    if (newPlace && newPlace.startsWith("img")) {
        return "this square already has a checker piecw";
    }
    if (newPlace === undefined || newPlace === "" || newPlace === null) {
        return "cannot place off the checker board";
    }
    let newSquare = (newPlace.split('_'));
    let oldSquare = (originPlace.split('_'));

    let newSquareInts = [];
    newSquareInts.push(parseInt(newSquare[0]));
    newSquareInts.push(parseInt(newSquare[1]));
    let oldSquareInts = [];
    oldSquareInts.push(parseInt(oldSquare[0]));
    oldSquareInts.push(parseInt(oldSquare[1]));

    // non valid square
    if ((newSquareInts[0] % 2 === 0 && newSquareInts[1] % 2 === 0) || (newSquareInts[0] % 2 != 0 && newSquareInts[1] % 2 != 0)) {
        return "you cannot move or jump to an off square"
    }

    let reply = "";
    if (playerDirection === "asc") {
        if (oldSquareInts[0] + 1 !== newSquareInts[0]) {
            if (checkForJumps(oldSquareInts, newSquareInts, otherPlayer, thisPlayer, playerDirection)) {
                resetTurn(thisPlayer, otherPlayer);
                return "";
            }
            reply = "cannot move more than one row unless jumping opponent pieces"
        }
    } else {
        if (oldSquareInts[0] - 1 !== newSquareInts[0]) {
            if (checkForJumps(oldSquareInts, newSquareInts, otherPlayer, thisPlayer, playerDirection)) {
                resetTurn(thisPlayer, otherPlayer);
                return "";
            }
            return "cannot move more than one row unless jumping opponent pieces"
        }
    }
    if (!(oldSquareInts[1] + 1 === newSquareInts[1] || oldSquareInts[1] - 1 === newSquareInts[1])) {
        return "cannot move to square other than right or left diagonal"
    }

    kingMe(playerDirection, newSquareInts, thisPlayer, originPlace, piece);
    resetTurn(thisPlayer, otherPlayer);
    return reply;
}

function kingMe(playerDirection, newSquareInts, thisPlayer, originPlace, piece) {
    let rowToKing = 1;
    if (playerDirection === "asc") {
        rowToKing = 8;
    }
    if (newSquareInts[0] === rowToKing) {
        piece.king = true;
        // let indexToUpdate = thisPlayer.pieces.findIndex(el => el.location === originPlace);
        // if (indexToUpdate > -1) {
        //     let newPiece = new Piece(piece.color, true, piece.locclsation);
        //     thisPlayer.pieces.splice(indexToUpdate, 1, newPiece);
        // }
    }
}

function checkForJumps(oldSquareInts, newSquareInts, otherPlayer, thisPlayer, playerDirection) {
    let squares = oldSquareInts[0] - newSquareInts[0];
    let jumps = Math.abs(squares / 2);
    if (jumps === 1) {
        // horizontal must be 2 and must be opposing piece between.
        let diff = newSquareInts[1] - oldSquareInts[1];
        if (diff === 2 || diff === -2) {
            // is there a piece?
            let move = 1;
            if (playerDirection === "asc") {
                move = -1
            }
            let location = (oldSquareInts[0] - move) + "_" + (oldSquareInts[1] + (diff / 2));
            let indexToRemove = otherPlayer.pieces.findIndex(el => el.location === location);
            if (indexToRemove > -1) {
                otherPlayer.pieces.splice(indexToRemove, 1);
            }
        }
        return true;
    }
    return false;
}

function resetTurn(thisPlayer, otherPlayer) {
    thisPlayer.turn = false;
    otherPlayer.turn = true;
}
