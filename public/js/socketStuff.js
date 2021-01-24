var url = window.location.href;
let socket = io.connect(url);
// intended globals
// checkerBoardWidthX Height used in move calculations to determine distance size, etc. (they should be same)
let checkerBoardWidthX = document.getElementById("checkerboard").offsetWidth;
let checkerBoardHeightY = document.getElementById("checkerboard").offsetWidth;
// playerNumber used to determine the direction of the board and such.
let invertedBoard = false;

function init() {
    drawCheckerBoard();
    checkerBoardWidthX = document.getElementById("checkerboard").offsetWidth;
    checkerBoardHeightY = document.getElementById("checkerboard").offsetWidth;
    socket.emit('init', {
        playerName: "getRealName"
    });
}

socket.on('initReturn', (data) => {
    let player = JSON.parse(data.player);
    addPieces(player.pieces, false);
});

socket.on('invertBoard', (data) => {
    invertBoard();
});

socket.on('updateBoard', (data) => {
    if (data){
        if (data.player1){
            let player = JSON.parse(data.player1);
            // console.log(player);
            addPieces(player.pieces, true);
        }
        if (data.player2){
            player = JSON.parse(data.player2);
            addPieces(player.pieces, false);
        }
    }
});

socket.on('flashMessage', (data) => {
    let message = data.message;
    let div = document.getElementById("modal_div");
    div.style.display = "block";
    document.getElementById("modal_msg").innerHTML = message;
    fade(div);
});

/*
* When piece is moving, send coordinants so other screen can show moves.
*/
let limiter = 0;
function sendXY(data) {
    // limit the sends, movement is not critical, just nice
    limiter = limiter + 1;
    if (limiter >= 10) {
        socket.emit('moving', data);
        limiter = 0;
    }
}

function sendDrop(piece, targetId){
    // console.log(targetId);
    // console.log(piece);
    socket.emit('drop', {targetId:targetId, pieceId: piece.id});
}

socket.on('otherPlayerMove', (data)=>{
    movePiece(data);
});
