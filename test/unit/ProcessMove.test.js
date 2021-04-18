const game = require('../mock-data/game.json');
const ProcessMove = require('../../sockets/classes/ProcessMove');
const Player = require('../../sockets/classes/Player');
const Game = require('../../sockets/classes/Game');
const Piece = require('../../sockets/classes/Piece');

let testGame;
describe("ProcessMove tests", () => {
    beforeEach(() => {

        let player1 = new Player(game.player1.socketId, game.player1.pieces, game.player1.name);
        let player2 = new Player(game.player2.socketId, game.player2.pieces, game.player2.name);
        setPlayerPieces(player1);
        setPlayerPieces(player2);
        player1.turn = true;
        player2.turn = false;
        testGame = new Game(player1, player2);
        testGame.rules.FIRST_JUMP_REQUIRED = true; // default but be sure is reset after tests that test this rule
    });

    it("validateAndProcessPlayerMove should exist", () => {
        expect(typeof ProcessMove.validateAndProcessPlayerMove).toBe("function");
    });

    it("should move piece when move is valid", () => {
        let indexOf6_1 = testGame.player1.pieces.findIndex(el => el.location === "6_1");

        let val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_1", "5_2")
        let game = val.game;
        let message = val.message;

        expect(game.player1.turn).toBeFalsy();
        expect(game.player2.turn).toBeTruthy();
        expect(game.player1.pieces[indexOf6_1].location).toEqual("5_2");
    });

    it("should not move if move is invalid", () => {
        let indexOf6_1 = testGame.player1.pieces.findIndex(el => el.location === "6_1");

        let val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_1", "5_3")
        let game = val.game;
        let message = val.message;

        expect(game.player1.turn).toBeTruthy();
        expect(game.player2.turn).toBeFalsy();
        expect(game.player1.pieces[indexOf6_1].location).toEqual("6_1");
    });


    it("should let player know jump is required", () => {

        // player1 moved left top over and up one, player 2 same side over
        // player1 can jump but 2 cannot becasue there is a piece in the way
        testGame.player1.pieces[11].location = "5_6";
        testGame.player2.pieces[11].location = "4_7";

        testGame.player1.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player1);
            if (index === 11) {
                expect(result).toBeTruthy();
            } else {
                expect(result).toBeFalsy();
            }
        });

        testGame.player2.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player2);
            expect(result).toBeFalsy();
        });

        // move player 1's piece out of the way
        testGame.player1.pieces[10].location = "5_4";
        testGame.player1.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player1);
            if (index === 11) {
                expect(result).toBeTruthy();
            } else {
                expect(result).toBeFalsy();
            }
        });

        testGame.player2.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player2);
            if (index === 11) {
                expect(result).toBeTruthy();
            } else {
                expect(result).toBeFalsy();
            }
        });
    });

    it("should not force backward jump, but king piece must backward jump", () => {
        testGame.player1.pieces[11].location = "4_5";
        testGame.player1.pieces[10].location = "5_6";
        testGame.player1.pieces[9].location = "5_2";
        testGame.player2.pieces[10].location = "5_4";

        testGame.player1.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player1);
            expect(result).toBeFalsy();
        });

        testGame.player2.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player2);
            expect(result).toBeFalsy();
        });

        // if piece is king it should jump
        testGame.player1.pieces[11].king = true;
        testGame.player1.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player1);
            if (index === 11) {
                expect(result).toBeTruthy();
            } else {
                expect(result).toBeFalsy();
            }
        });

        testGame.player2.pieces.forEach((piece, index) => {
            let result = ProcessMove.shouldPieceJump(piece, testGame, testGame.player2);
            expect(result).toBeFalsy();
        });
    });


    it("should report required jump as needed", () => {

        let shouldJump = ProcessMove.shouldAnyPlayerPieceJump(testGame, testGame.player1, "6_1", "5_2")
        expect(shouldJump).toBeFalsy();

        testGame.player1.pieces[11].location = "5_6";
        testGame.player2.pieces[11].location = "4_7";
        testGame.player1.turn = true;
        testGame.player2.turn = false;

        shouldJump = ProcessMove.shouldAnyPlayerPieceJump(testGame, testGame.player1, "6_1", "5_2")
        expect(shouldJump).toBeTruthy();
        expect(game.player1.turn).toBeTruthy();

        result = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_1", "5_2", ProcessMove.rules);
        expect(result.message).toContain("You have at least one jump on the board");
        expect(testGame.player1.pieces[8].location).toEqual("6_1");
    });


    it("should skip report required jump if optioned out", () => {

        let shouldJump = ProcessMove.shouldAnyPlayerPieceJump(testGame, testGame.player1, "6_1", "5_2")
        expect(shouldJump).toBeFalsy();

        testGame.player1.pieces[11].location = "5_6";
        testGame.player2.pieces[11].location = "4_7";
        testGame.player1.turn = true;
        testGame.player2.turn = false;

        shouldJump = ProcessMove.shouldAnyPlayerPieceJump(testGame, testGame.player1, "6_1", "5_2")
        expect(shouldJump).toBeTruthy();
        expect(game.player1.turn).toBeTruthy();

        testGame.rules.FIRST_JUMP_REQUIRED = false;
        result = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_1", "5_2");
        expect(result.message).toBeFalsy();
        expect(testGame.player1.pieces[8].location).toEqual("5_2");

    });


    it("properly proceses jump when jump is required or jump is made", () => {
        testGame.player1.pieces[11].location = "5_6";
        testGame.player2.pieces[11].location = "4_7";

        let val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_1", "5_2")
        let game = val.game;
        let message = val.message;

        expect(game.player1.turn).toBeTruthy();
        expect(game.player2.turn).toBeFalsy();
        expect(game.player1.pieces.length).toEqual(12);
        expect(game.player2.pieces.length).toEqual(12);
        expect(message).toContain("You have at least one jump on the board");
        expect(game.player1.pieces[8].location).toEqual("6_1");

        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "5_6", "3_8")
        game = val.game;
        message = val.message;

        expect(game.player1.turn).toBeFalsy();
        expect(game.player2.turn).toBeTruthy();
        expect(game.player1.pieces.length).toEqual(12);
        expect(game.player2.pieces.length).toEqual(11);
        expect(game.player1.pieces[11].location).toEqual("3_8");
    });

    it("Force additional jump if the player has an additional jump", () => {

        // remove 1_4, move 3_2 to 5_2 red for additional jump, move 3_6 to 4_7 red, 6_7 to 5_8 black, black's turn
        testGame.player2.pieces[8].location = "5_2";
        testGame.player2.pieces[10].location = "4_7"
        testGame.player2.pieces.splice(1, 1);
        testGame.player1.pieces[11].location = "5_8";
        testGame.player1.turn = true;
        testGame.player2.turn = false;

        // first jump
        let val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "5_8", "3_6")
        let game = val.game;
        let message = val.message;
        expect (message).toBeFalsy();
        expect(game.player1.turn).toBeTruthy();
        expect(game.player2.turn).toBeFalsy();
        expect(game.player1.pieces.length).toEqual(12);
        expect(game.player2.pieces.length).toEqual(10);
        expect(testGame.player1.pieces[11].location).toEqual("3_6");

        // try a different move and it should fail with message
        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_3", "5_2")
        game = val.game;
        message = val.message;
        expect(message).toContain("You must complete the jump chain (another jump with the same piece)");
        expect(game.player1.turn).toBeTruthy();

        // try a jump with different piece
        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_1", "4_3")
        game = val.game;
        message = val.message;
        expect(message).toContain("You must complete the jump chain (another jump with the same piece)");
        expect(game.player1.turn).toBeTruthy();

        // do the next jump
        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "3_6", "1_4")
        game = val.game;
        message = val.message;
        expect (message).toBeFalsy();
        expect(game.player1.turn).toBeTruthy();
        expect(game.player2.turn).toBeFalsy();
        expect(game.player1.pieces.length).toEqual(12);
        expect(game.player2.pieces.length).toEqual(9);
        expect(game.player1.pieces[11].king === true);

         // try a different move and it should fail with message
        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "6_3", "5_2")
        game = val.game;
        message = val.message;
        expect(message).toContain("You must complete the jump chain (another jump with the same piece)");
        expect(game.player1.turn).toBeTruthy();

        // do the next jump as a KING and done with turn
        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "1_4", "3_2")
        game = val.game;
        message = val.message;
        expect (message).toBeFalsy();
        expect(game.player1.turn).toBeFalsy();
        expect(game.player2.turn).toBeTruthy();
        expect(game.player1.pieces.length).toEqual(12);
        expect(game.player2.pieces.length).toEqual(8);
        expect(game.player1.pieces[11].king === true);
        expect(game.player1.pieces[11].localtion === "3_2");
    });

    it("should king me", () => {

        // kind of unrealistic board, but setting up
        // with pieces that can king and there are no jumps
        testGame.player2.pieces[3].location = "4_1";
        testGame.player2.pieces[7].location = "5_2";
        testGame.player2.pieces[8].location = "4_3";
        testGame.player1.pieces[3].location = "6_7";
        testGame.player1.pieces[7].location = "3_8";

        testGame.player1.pieces[11].location = "2_7";
        testGame.player2.pieces[11].location = "7_8";

        expect(testGame.player1.pieces[9].king).toBeFalsy();

        let val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player1, "2_7", "1_8")
        let game = val.game;
        let message = val.message;

        expect(message).toBeFalsy();
        expect(game.player1.turn).toBeFalsy();
        expect(game.player2.turn).toBeTruthy();
        expect(testGame.player1.pieces[11].king).toBeTruthy();

        expect(testGame.player2.pieces[11].king).toBeFalsy();
        val = ProcessMove.validateAndProcessPlayerMove(testGame, testGame.player2, "7_8", "8_7");
        game = val.game;
        message = val.message;
        expect(game.player1.turn).toBeTruthy();
        expect(game.player2.turn).toBeFalsy();
        expect(testGame.player2.pieces[11].king).toBeTruthy();
    });

    it("player1 should have move or if no move possible loses", () => {

        let hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeTruthy();

        // block 'em all
        testGame.player2.pieces[8].location = "5_2";
        testGame.player2.pieces[9].location = "5_4";
        testGame.player2.pieces[10].location = "5_6";
        testGame.player2.pieces[11].location = "5_8";
        testGame.player2.pieces[4].location = "4_1";
        testGame.player2.pieces[5].location = "4_3";
        testGame.player2.pieces[6].location = "4_5";
        testGame.player2.pieces[7].location = "4_7";

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeFalsy();

        // put 'em back
        testGame.player2.pieces[8].location = "3_2";
        testGame.player2.pieces[9].location = "3_4";
        testGame.player2.pieces[10].location = "3_6";
        testGame.player2.pieces[11].location = "3_8";
        testGame.player2.pieces[4].location = "2_1";
        testGame.player2.pieces[5].location = "2_3";
        testGame.player2.pieces[6].location = "2_5";
        testGame.player2.pieces[7].location = "2_7";

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeTruthy();

        // remove all, but one and block it.
        let piece = new Piece("B", false, "4_1");
        let pieces = [];
        pieces.push(piece);
        testGame.player1.pieces = pieces;
        // put one behind it so we can king it later.
        testGame.player2.pieces[11].location = "5_2";

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeFalsy();

        testGame.player1.pieces[0].king = true;
        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeTruthy();

        // no longer king
        testGame.player1.pieces[0].king = false;
        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeFalsy();

        // make that last one a jump and it will be true again
        testGame.player2.pieces.splice(5, 1);

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeTruthy();
        // no pieces is no move
        testGame.player1.pieces.splice(0, 1);
        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player1);
        expect(hasMove).toBeFalsy();
    });


    it("player2 should have move or if no move possible looses", () => {

        let hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeTruthy();

        // block 'em all
        testGame.player1.pieces[8].location = "5_2";
        testGame.player1.pieces[9].location = "5_4";
        testGame.player1.pieces[10].location = "5_6";
        testGame.player1.pieces[11].location = "5_8";
        testGame.player1.pieces[4].location = "4_1";
        testGame.player1.pieces[5].location = "4_3";
        testGame.player1.pieces[6].location = "4_5";
        testGame.player1.pieces[7].location = "4_7";

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeFalsy();

        // put 'em back
        testGame.player1.pieces[8].location = "7_2";
        testGame.player1.pieces[9].location = "7_4";
        testGame.player1.pieces[10].location = "7_6";
        testGame.player1.pieces[11].location = "7_8";
        testGame.player1.pieces[4].location = "6_1";
        testGame.player1.pieces[5].location = "6_3";
        testGame.player1.pieces[6].location = "6_5";
        testGame.player1.pieces[7].location = "6_7";

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeTruthy();

        // remove all, but one and block it.
        let piece = new Piece("B", false, "5_2");
        let pieces = [];
        pieces.push(piece);
        testGame.player2.pieces = pieces;
        // put one behind it so we can king it later.
        testGame.player1.pieces[11].location = "4_3";

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeFalsy();

        testGame.player2.pieces[0].king = true;
        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeTruthy();

        // no longer king
        testGame.player2.pieces[0].king = false;
        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeFalsy();

        // make that last one a jump and it will be true again
        testGame.player1.pieces.splice(5, 1);

        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeTruthy();
        // no pieces is no move
        testGame.player2.pieces.splice(0, 1);
        hasMove = ProcessMove.doesPlayerHaveAMove(testGame, testGame.player2);
        expect(hasMove).toBeFalsy();
    });
});

function setPlayerPieces(player) {
    let pieces = [];
    player.pieces.forEach((p) => {
        let piece = new Piece(p.color, p.king, p.location);
        pieces.push(piece);
    });
    player.pieces = pieces;
}
