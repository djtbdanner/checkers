function initGame(playerTwoId) {
    resetUpdatePoolMonitor();
    let firstJumpRule = firstJumpRuleMenu.innerHTML === FIRST_JUMP_RULE_ON;
    checkerboard.classList.remove("flip");
    socket.emit('initGame', {
        playerTwoId,
        firstJumpRule
    });
}

socket.on('initGameReturn', (data) => {
    resetUpdatePoolMonitor();
    drawCheckerBoard();
    checkerBoardWidthX = checkerboard.offsetWidth;
    checkerBoardHeightY = checkerboard.offsetWidth;
    let player1 = JSON.parse(data.player);
    addPieces(player1.pieces, true);
    let player2 = JSON.parse(data.otherPlayer);
    addPieces(player2.pieces, false);
    let gameRules = JSON.parse(data.gameRules);
    if (gameRules.FIRST_JUMP_REQUIRED){
        firstJumpRuleMenu.innerHTML = FIRST_JUMP_RULE_ON;
    } else {
        firstJumpRuleMenu.innerHTML = FIRST_JUMP_RULE_OFF;
    }
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
    drawPlayerPool(JSON.parse(data.players), player);
});

// reinitilaze game - likely due to other player leaving
socket.on('otherPlayerLeft', (data) => {
    logIn();
    alertBox(`${data.message}`, false);
});

socket.on('invertBoard', (data) => {
    invertBoard();
});

socket.on('resetInvert', (data) => {
    checkerboard.classList.remove("flip");
    invertedBoard = false;
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
    if (sound === "fail"){
        fail.play();
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

socket.on('backendError', (data) => {
    alert(JSON.stringify(data));
});

function disconnect() {
    socket.disconnect();
}

function reconnect() {
    socket.connect();
}

socket.on('otherPlayerMove', (data) => {
    movePiece(data);
});

function playerJumpRuleOn(){
    const playerName = storedPlayerNameElement.value;
    const playerId = storedPlayerIdElement.value;
    socket.emit('playerJumpRuleOn', {
        playerName,
        playerId
    });
    firstJumpRuleMenu.innerHTML = FIRST_JUMP_RULE_ON;
    checkMessageDivForJumpRule(true);
}

function playerJumpRuleOff(){
    const playerName = storedPlayerNameElement.value;
    const playerId = storedPlayerIdElement.value;
    socket.emit('playerJumpRuleOff', {
        playerName,
        playerId
    });
    firstJumpRuleMenu.innerHTML = FIRST_JUMP_RULE_OFF;
    checkMessageDivForJumpRule(false);
}

socket.on('playerTurnedOnJumpRule', (data) => {
    let name = data.playerName;
    alertBox(`${name} turned the 1<sup>st</sup> jump rule <b>ON</b>.`, false);
    firstJumpRuleMenu.innerHTML = FIRST_JUMP_RULE_ON;
    checkMessageDivForJumpRule(true);
});

socket.on('playerTurnedOffJumpRule', (data) => {
    let name = data.playerName;
    alertBox(`${name} turned the 1<sup>st</sup> jump rule <b>OFF</b>.`, false);
    firstJumpRuleMenu.innerHTML = FIRST_JUMP_RULE_OFF;
    checkMessageDivForJumpRule(false);
});
