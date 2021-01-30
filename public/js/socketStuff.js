function init() {
    drawCheckerBoard();
    let playerName = playerNameElement.value;
    console.log(playerName)
    checkerBoardWidthX = document.getElementById("checkerboard").offsetWidth;
    checkerBoardHeightY = document.getElementById("checkerboard").offsetWidth;
    socket.emit('init', {
        playerName
    });
    /// save the user name
    if (typeof (Storage) !== "undefined") {
        try {
            localStorage.setItem("s-playerName", playerName);
        } catch (err) {
            console.log(err);
        }
    }

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
            tap.play();
        }
    }
});

socket.on('flashMessage', (data) => {
    let message = data.message;
    let div = document.getElementById("messageDiv");
    div.style.display = "block";
    div.innerHTML = message;
    console.log(message)
    //fade(div);
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
    socket.emit('drop', {targetId:targetId, pieceId: piece.id});
}

socket.on('otherPlayerMove', (data)=>{
    movePiece(data);
});
