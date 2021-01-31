function init() {
    drawCheckerBoard();
    addListeners();
    let playerName = playerNameElement.value;
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

// reinitilaze game - likely due to other player leaving
socket.on('reInitReturn', (data) => {
    if (invertedBoard){
        invertBoard();
    }
    drawCheckerBoard();
    checkerBoardWidthX = document.getElementById("checkerboard").offsetWidth;
    checkerBoardHeightY = document.getElementById("checkerboard").offsetWidth;
    let player = JSON.parse(data.player);
    addPieces(player.pieces, true);
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
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
});

socket.on('playSound', (data) => {
    let sound = data.sound;
    if (sound === "king"){
        king.play();
    }
    if (sound === "cheer"){
        cheer.play();
    }
    if (sound === "tap"){
        tap.play();
    }    
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

function disconnect(){
    socket.disconnect();
}

function reconnect(){
    socket.connect();
}

socket.on('otherPlayerMove', (data)=>{
    movePiece(data);
});
