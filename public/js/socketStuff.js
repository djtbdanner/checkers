let socket = io.connect('http://localhost:8080')

function init() {
    drawCheckerBoard();
    socket.emit('init', {
        playerName: "getRealName"
    });
}

socket.on('initReturn', (data) => {
    let player = JSON.parse(data.player);
    addPieces(player.pieces, false);
});

socket.on('updateBoard', (data) => {
    let player = JSON.parse(data.player1);
    console.log(player);
    addPieces(player.pieces, true);
    player = JSON.parse(data.player2);
    addPieces(player.pieces, false);
});

socket.on('flashMessage', (data) => {
    let message = data.message;
    let div = document.getElementById("modal_div");
    div.style.display = "block";
    document.getElementById("modal_msg").innerHTML = message;
    fade(div);
});

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
    console.log(targetId);
    console.log(piece);
    socket.emit('drop', {targetId:targetId, pieceId: piece.id});
}

socket.on('otherPlayerMove', (data)=>{
    movePiece(data);
});
