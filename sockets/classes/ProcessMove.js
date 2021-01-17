const Piece = require("./Piece");
const Game = require("./Game");
const Player = require("./Player");

// exports.isValidMove = (thisPlayer, otherPlayer, originPlace, newPlace, piece) => {
exports.validateAndProcessPlayerMove = (game, currentPlayer, origin, destination) => {
    // console.log(game);
    // console.log(currentPlayer);
    // console.log(origin);
    // console.log(destination);
    let otherPlayer = game.getOtherPlayer(currentPlayer);

    if (!currentPlayer.turn) {
        return { game, message: `it is ${otherPlayer.name}'s turn` };
    }

    const pieceIndex = currentPlayer.pieces.findIndex(el => el.location === origin);
    let piece = undefined;
    if (pieceIndex > -1) {
        piece = currentPlayer.pieces[pieceIndex];
    }
    if (piece === undefined) {
        return { game, message: `cannot move opponent's pieces` };
    }
    if (destination && destination.startsWith("img")) {
        return { game, message: `cannot move to an occupied square` };
    }
    if (destination === undefined || destination === "" || destination === null) {
        return { game, message: `cannot place off the checker board` };
    }

    let { destinationInts, originInts } = getSquaresAsInts(destination, origin);

    // non valid square
    if ((destinationInts[0] % 2 === 0 && destinationInts[1] % 2 === 0) || (destinationInts[0] % 2 != 0 && destinationInts[1] % 2 != 0)) {
        return { game, message: `must move diagonally in the forward direction (towards the opponent) to the next dark square` };
    }

    // pieces that are not kings are directional
    if (!piece.king) {
        let rowsMoved = originInts[0] - destinationInts[0];
        if (rowsMoved > 0 && currentPlayer.decending || rowsMoved < 1 && !currentPlayer.decending) {
            return { game, message: `you cannot move that direction unless your piece has been "kinged"` };
        }
    }

    let mustJump = currentPlayerMustJump(game, currentPlayer);

    // over 2 must be a jump
    if (Math.abs(originInts[0] - destinationInts[0]) > 1 || Math.abs(originInts[1] - destinationInts[1]) > 1) {
        if (!validateAndProcesPlayerJump(originInts, destinationInts, game, currentPlayer)) {
            return { game, message: `you cannot move more than one row at a time unless you are jumping an opponent piece` };
        }
    }

    if (!piece.king) {
        piece.king = kingMe(currentPlayer, destinationInts);
    }
    game.resetTurn();
    let newPiece = new Piece(piece.color, piece.king, destination);
    currentPlayer.pieces[pieceIndex] = newPiece;
    return { game, message: undefined };
}

function getSquaresAsInts(destination, origin) {
    let newSquare = (destination.split('_'));
    let oldSquare = (origin.split('_'));
    let destinationInts = [];
    destinationInts.push(parseInt(newSquare[0], 10));
    destinationInts.push(parseInt(newSquare[1], 10));
    let originInts = [];
    originInts.push(parseInt(oldSquare[0], 10));
    originInts.push(parseInt(oldSquare[1], 10));
    return { destinationInts, originInts };
}

function kingMe(currentPlayer, newSquareInts) {
    let rowToKing = 1;
    if (currentPlayer.decending) {
        rowToKing = 8;
    }
    if (newSquareInts[0] === rowToKing) {
        return true;
    }
    return false
}

function validateAndProcesPlayerJump(oldSquareInts, newSquareInts, game, currentPlayer) {
    // assume at this point that the direction has already been validated, so absolute value can be used
    // 0 is rows and 1 is columns
    let rowsIs2 = Math.abs((oldSquareInts[0] - newSquareInts[0]) / 2) === 1;
    let columnsIs2 = Math.abs((oldSquareInts[1] - newSquareInts[1]) / 2) === 1;
    if (rowsIs2 && columnsIs2) {
        let jumpedRow = oldSquareInts[0] + 1;
        if (oldSquareInts[0] > newSquareInts[0]) {
            jumpedRow = oldSquareInts[0] - 1;
        }
        let jumpedColumn = oldSquareInts[1] + 1;
        if (oldSquareInts[1] > newSquareInts[1]) {
            jumpedColumn = oldSquareInts[1] - 1;
        }
        let otherPieceLocation = `${jumpedRow}_${jumpedColumn}`;
        let otherPlayer = game.getOtherPlayer(currentPlayer);
        let indexToRemove = otherPlayer.pieces.findIndex(el => el.location === otherPieceLocation);
        if (indexToRemove > -1) {
            otherPlayer.pieces.splice(indexToRemove, 1);
            return true;
        }
    }
    return false;
}

function currentPlayerMustJump  (currentPlayer, game)  {
    let otherPlayer = game.getOtherPlayer(currentPlayer);
    // check each piece for current player to see if there is a jump
    let matchFound = false;
    currentPlayer.pieces.forEach(currentPlayerPiece => {
        otherPlayer.pieces.every(otherPlayerPiece => {
            let { destinationInts, originInts } = getSquaresAsInts(otherPlayerPiece.location, currentPlayerPiece.location);
            console.log(`THIS: ${destinationInts}, ${originInts}`);
            let isOpponentPieceOneRowOff = false;
            if (currentPlayerPiece.king) {
                isOpponentPieceOneRowOff = Math.abs(destinationInts[0] - originInts[0]) === 1;
            } else {
                let row = 1;
                if (currentPlayer.decending) {
                    row = -1;
                }
                isOpponentPieceOneRowOff = destinationInts[0] - originInts[0] === row;
                if (isOpponentPieceOneRowOff) {
                    let isOpponentPieceOneColumnOff = false;
                    isOpponentPieceOneColumnOff = Math.abs(destinationInts[1] - originInts[1]) === 1;
                    if (isOpponentPieceOneColumnOff){
                        console.log(`found a potential jump ${destinationInts}, ${originInts}`)
                        matchFound = true;

                    }
                }
            }
        });
    });
    return matchFound;
}

exports.currentPlayerMustJump =currentPlayerMustJump;