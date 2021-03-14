function initGame(playerTwoId) {
    clearInterval(updatePool);
    socket.emit('initGame', {
        playerTwoId
    });
}

socket.on('initGameReturn', (data) => {
    clearInterval(updatePool);
    drawCheckerBoard();
    addListeners();
    checkerBoardWidthX = checkerboard.offsetWidth;
    checkerBoardHeightY = checkerboard.offsetWidth;
    let player1 = JSON.parse(data.player);
    addPieces(player1.pieces, true);
    let player2 = JSON.parse(data.otherPlayer);
    addPieces(player2.pieces, false);
});

function joinPool() {playerNameElement
    if (checkerboard.style.display === "block"){
        alert ("Navigate to the Home page to abandon the game.");
        return;
    }
    let playerName = playerNameElement.value;
    if (!playerName || playerName === "") {
        playerName = playerNameElement.value;
    }
    const playerId = storedPlayerIdElement.value;
    socket.emit('joinPool', {
        playerName,
        playerId
    });
    /// save the user name locally
    if (typeof (Storage) !== "undefined") {
        try {
            localStorage.setItem("s-playerName", playerName);
        } catch (err) {
            console.log(err);
        }
    }
}

socket.on('joinPoolReturn', (data) => {
    let player = JSON.parse(data.player);
    storedPlayerIdElement.value = player.id;
    storedPlayerNameElement.value = player.name;
    /// name may have been set or modified by the back end
    playerNameElement.value = player.name;
    drawPlayerPool(JSON.parse(data.players));
});

// reinitilaze game - likely due to other player leaving
socket.on('reInitReturn', (data) => {
    if (invertedBoard) {
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
    if (data) {
        if (data.player1) {
            let player = JSON.parse(data.player1);
            // console.log(player);
            addPieces(player.pieces, true);
        }
        if (data.player2) {
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
    if (sound === "king") {
        king.play();
    }
    if (sound === "cheer") {
        cheer.play();
    }
    if (sound === "tap") {
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

function sendDrop(piece, targetId) {
    socket.emit('drop', { targetId: targetId, pieceId: piece.id });
}

function disconnect() {
    socket.disconnect();
}

function reconnect() {
    socket.connect();
}

socket.on('otherPlayerMove', (data) => {
    movePiece(data);
});
