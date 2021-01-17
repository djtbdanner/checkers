const game = require('../mock-data/game.json');
const ProcessMove = require('../../sockets/classes/ProcessMove');
const Player = require('../../sockets/classes/Player');
const Game = require('../../sockets/classes/Game');
const Piece = require('../../sockets/classes/Piece');


//console.log(JSON.stringify(game));
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

        let piece = new Piece("B", false, "4_2");
        testGame.player1.pieces[0] = piece;

        piece = new Piece("R", false, "5_3");
        testGame.player2.pieces[0] = piece;

        let result = ProcessMove.currentPlayerMustJump(testGame.player1, testGame);
       // expect(result).toBeTruthy();

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
