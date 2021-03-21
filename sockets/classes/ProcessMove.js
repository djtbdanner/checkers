const Piece = require("./Piece");
const Game = require("./Game");
const Player = require("./Player");

exports.validateAndProcessPlayerMove = (game, currentPlayer, origin, destination) => {
    let otherPlayer = game.getOtherPlayer(currentPlayer);

    if (!currentPlayer.turn) {
        return { game, message: `it is ${otherPlayer.name}'s turn` };
    }

    let piece = currentPlayer.pieces.find(el => el.location === origin);
    if (piece === undefined) {
        return { game, message: `cannot move opponent's pieces` };
    }

    if (destination && destination.startsWith("img")) {
        if (destination.split("img_")[1] === origin){
            // player put piece back into original square
            return {game};
        }
        return { game, message: `cannot move to an occupied square` };
    }

    if (destination === undefined || destination === "" || destination === null) {
        return { game, message: `cannot place off the checker board` };
    }

    let { destinationInts, originInts } = getSquaresAsInts(destination, origin);

    // non valid square
    if ((destinationInts[0] % 2 === 0 && destinationInts[1] % 2 === 0) || (destinationInts[0] % 2 != 0 && destinationInts[1] % 2 != 0)) {
        return { game, message: `must move diagonally in the forward direction (towards the opponent)` };
    }

    // pieces that are not kings are directional
    if (!piece.king) {
        let rowsMoved = originInts[0] - destinationInts[0];
        if (rowsMoved > 0 && !currentPlayer.decending || rowsMoved < 1 && currentPlayer.decending) {
            return { game, message: `You cannot move that direction unless your piece is "kinged"` };
        }
    }

    let mustJump = shouldAnyPlayerPieceJump(game, currentPlayer);

    // over 2 must be a jump
    let didJump = false;
    if (Math.abs(originInts[0] - destinationInts[0]) > 1 || Math.abs(originInts[1] - destinationInts[1]) > 1) {
        didJump = validateAndProcesPlayerJump(originInts, destinationInts, game, currentPlayer);
        if (!didJump) {
            return { game, message: `You cannot move more than one row at a time` };
        }
    }

    // if a jump is required, be sure one was done.
    if (mustJump && !didJump) {
        return { game, message: `You have at least one jump on the board` };
    }

    let kinged = false;
    if (!piece.king) {
        piece.king = kingMe(currentPlayer, destinationInts);
        kinged = piece.king;
    }
    piece.location = destination;

    if (didJump && shouldPieceJump(piece, game, currentPlayer)) {
    } else {
        game.resetTurn();
    }

    if (!doesPlayerHaveAMove(game, otherPlayer)){
        currentPlayer.winner = true;
    }

    return { game, message: undefined, kinged };
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
    let rowToKing = 8;
    if (currentPlayer.decending) {
        rowToKing = 1;
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

function shouldPieceJump(piece, game, currentPlayer) {
    let otherPlayer = game.getOtherPlayer(currentPlayer);
    let pieceShouldJump = false;
    otherPlayer.pieces.every(otherPlayerPiece => {
        let { destinationInts, originInts } = getSquaresAsInts(otherPlayerPiece.location, piece.location);
        let isOpponentPieceOneRowOff = false;
        if (piece.king) {
            isOpponentPieceOneRowOff = Math.abs(destinationInts[0] - originInts[0]) === 1;
        } else {
            let rowAdder = 1;
            if (currentPlayer.decending) {
                rowAdder = -1;
            }
            isOpponentPieceOneRowOff = destinationInts[0] - originInts[0] === rowAdder;
        }
        if (isOpponentPieceOneRowOff) {
            let isOpponentPieceOneColumnOff = false;
            isOpponentPieceOneColumnOff = Math.abs(destinationInts[1] - originInts[1]) === 1;
            if (isOpponentPieceOneColumnOff) {
                // console.log(`my piece ${originInts}, opponent ${destinationInts}`);
                // now is the next square empty (works forward, backward, king, on board or off)
                let rowAdder = destinationInts[0] > originInts[0] ? 1 : -1;
                let rowToCheckForEmpty = destinationInts[0] + rowAdder;
                let columnAdder = destinationInts[1] > originInts[1] ? 1 : -1;
                let columnToCheckForEmpty = destinationInts[1] + columnAdder;
                if (0 < rowToCheckForEmpty && rowToCheckForEmpty <= 8 && 0 < columnToCheckForEmpty && columnToCheckForEmpty <= 8) {
                    let locationToLand = `${rowToCheckForEmpty}_${columnToCheckForEmpty}`;
                    let index = game.allPieces().findIndex(el => el.location === locationToLand);
                    if (index === -1) {
                        pieceShouldJump = true;
                        return false;// this tells the 'every' to stop cause we are done, we found a jump
                    }
                }
            }
        }
        return true;/// keep looping
    });
    return pieceShouldJump;
}
// any of this players pieces have a jump
function shouldAnyPlayerPieceJump(game, currentPlayer) {
    let thereIsAJump = false;
    currentPlayer.pieces.every((piece) => {
        if (shouldPieceJump(piece, game, currentPlayer)) {
            thereIsAJump = true;
            return false;/// stop loop, not returning false as a value
        }
        return true;
    });
    return thereIsAJump;
}

function doesPlayerHaveAMove(game, currentPlayer) {
    let thereIsAMove = false;
    if (currentPlayer === undefined || currentPlayer.pieces === undefined) {
        return false;
    }
    let allPieces = game.allPieces();
    currentPlayer.pieces.every((piece) => {
        // is there an open spot
        let { destinationInts, originInts } = getSquaresAsInts("0_0", piece.location);
        let rowToCheckForEmpty = originInts[0] + 1;
        if (currentPlayer.decending) {
            rowToCheckForEmpty = originInts[0] - 1;
        }
        if (checkColumns(rowToCheckForEmpty, originInts, allPieces)) {
            thereIsAMove = true;
            return false;// stop loop
        }
        if (piece.king === true) {
            let rowToCheckForEmpty = originInts[0] - 1;
            if (currentPlayer.decending) {
                rowToCheckForEmpty = originInts[0] + 1;
            }
            if (checkColumns(rowToCheckForEmpty, originInts, allPieces)) {
                thereIsAMove = true;
                return false;// stop loop
            }
        }
        if (shouldPieceJump(piece, game, currentPlayer)) {
            thereIsAMove = true;
            return false;/// stop loop, not returning false as a value
        }
        return true;
    });
    return thereIsAMove;
}

function checkColumns(rowToCheckForEmpty, originInts, allPieces) {
    if (0 < rowToCheckForEmpty && rowToCheckForEmpty <= 8) {
        columnToCheckForEmpty = originInts[1] - 1;
        if (0 < columnToCheckForEmpty && columnToCheckForEmpty <= 8) {
            let locationToLand = `${rowToCheckForEmpty}_${columnToCheckForEmpty}`;
            let index = allPieces.findIndex(el => el.location === locationToLand);
            if (index === -1) {
                return true;
            }
        }
        columnToCheckForEmpty = originInts[1] + 1;
        if (0 < columnToCheckForEmpty && columnToCheckForEmpty <= 8) {
            let locationToLand = `${rowToCheckForEmpty}_${columnToCheckForEmpty}`;
            let index = allPieces.findIndex(el => el.location === locationToLand);
            if (index === -1) {
                return true;
            }
        }
    }
    return false;
}

exports.shouldPieceJump = shouldPieceJump;
exports.shouldAnyPlayerPieceJump = shouldAnyPlayerPieceJump;
exports.doesPlayerHaveAMove = doesPlayerHaveAMove;