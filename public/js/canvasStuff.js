function drawCheckerBoard() {
    resetUpdatePoolMonitor();
    loginDiv.style.display = "none";
    userSelectDiv.style.display = "none";
    checkerboard.style.display = "block";
    let existingTable = document.getElementById("ch_table");
    if (existingTable) {
        existingTable.remove();
    }
    let table = document.createElement("table");
    table.id = "ch_table"
    table.draggable = false;
    let row;
    let rowNumber = 0;
    let columnNumber = 0;
    for (i = 0; i < 64; i++) {
        if (i % 8 === 0) {
            row = document.createElement("tr");
            table.appendChild(row);
            rowNumber += 1;
            columnNumber = 1;
        }
        var tableData = document.createElement("td");
        if (rowNumber % 2 === 0) {
            if (i % 2 === 0) {
                tableData.className = "playsquare";
            } else {
                tableData.className = "offsquare";
            }
        } else {
            if (i % 2 != 0) {
                tableData.className = "playsquare";
            } else {
                tableData.className = "offsquare";
            }
        }
        tableData.innerHTML = '&nbsp;';
        tableData.id = rowNumber + '_' + columnNumber;
        columnNumber = columnNumber + 1;
        row.appendChild(tableData);
    }
    checkerboard.appendChild(table);
}

function drawPlayerPool(players, player) {
    loginDiv.style.display = "none";
    checkerboard.style.display = "none";
    messageDiv.style.display = "none";
    messageDiv.innerHTML = "";
    userSelectDiv.style.display = "block";

    let users = players.filter((p) => { return p.id !== storedPlayerIdElement.value });
    htmlString = "";
    if (users === undefined || users.length === 0) {
        userSelectDisplay.innerHTML = "No users found at this time, your name will be on the list for any other player logging in.";
    } else {
        let links = '';
        links += `${player.name}, select a player for a checkers challenge...</p>`;
        users.forEach((user, index) => {
            if (index > 0 && index % 4 === 0) {
                links += `<br><br>`;
            }
            links += ` <a href="#" onclick = "initGame('${user.id}')" class="login_button">${user.name}</a>`;
    
        });
        links += `<br><br>`;
        userSelectDisplay.innerHTML = links;
    }
    if (!updatePool) {
        updatePool = setInterval(joinPool, 3000);
    }
}
let updatePool;
function resetUpdatePoolMonitor (){
    clearInterval(updatePool);
    updatePool = undefined;
}


function invertBoard() {
    resetUpdatePoolMonitor();
    let checkerboard = document.getElementById("checkerboard");
    if (invertedBoard) {
        checkerboard.classList.remove("flip");
    } else {
        checkerboard.classList.add("flip");
    }
    invertedBoard = !invertedBoard;
}

function addPieces(playerPieces, clearPiecesFirst) {
    if (clearPiecesFirst) {
        let pieces = document.querySelectorAll(".checkerpiece");
        if (pieces) {
            pieces.forEach(p => p.remove());
        }
    }
    if (playerPieces) {
        playerPieces.forEach((piece, index) => {
            let square = document.getElementById(piece.location);
            let imgName = "Black.png";
            if (piece.king) {
                imgName = "KingBlack.png"
            }
            if (piece.color === "R") {
                imgName = "Red.png"
                if (piece.king) {
                    imgName = "KingRed.png"
                }
            }
            appendImage(square, imgName);
        });
    }
    playSlideSoundOnMovePiece = true;
}

function appendImage(square, image) {
    var img = document.createElement('img');
    img.src = '/images/' + image;
    var width = square.clientWidth;
    var height = square.clientHeight;
    img.style.width = (width - 5) + "px";
    img.style.height = (height - 5) + "px";
    img.classList.add("checkerpiece");
    img.id = "img_" + square.id;
    img.draggable = true;
    // no earthly clue why these have to be reset.
    square.style.width = width + "px";
    square.style.height = height + "px";
    square.appendChild(img);
}

let playSlideSoundOnMovePiece = true;
function movePiece(pieceData) {
    let data = JSON.parse(pieceData);
    let piece = document.getElementById(data.piece);
    let pieceWidth = piece.offsetWidth;
    let otherWidth = data.boardWidth;
    let percent = checkerBoardWidthX / otherWidth;
    let x = Math.round(parseFloat(data.x) * percent) - Math.round(pieceWidth / 2);
    let y = Math.round(parseFloat(data.y) * percent) - Math.round(pieceWidth / 2);
    let pos = piece.style.position;
    piece.style.position = "absolute";
    //    console.log(JSON.stringify(data) + `x = ${x}, y = ${y}, percent =${percent} otherwidth =${otherWidth} width = ${checkerBoardWidth}`);
    piece.style.top = y + "px";
    piece.style.left = x + "px";
    if (playSlideSoundOnMovePiece) {
        slide.play();
    }
    playSlideSoundOnMovePiece = false;
}

function addListeners() {
    /// -- Drag event processing for desktop screens
    let dragged = {};
    document.addEventListener('drop', (event) => {
        event.preventDefault();
        if (event.target.style) {
            event.target.style.opacity = "";
        }
        //dragged.style.display = "block";
        sendDrop(dragged, event.target.id);
    }, false);
    document.addEventListener('dragstart', (event) => {
        dragged = event.target;
        dragged.style.opacity = .5;
    }, false);
    document.addEventListener("dragover", function (event) {
        event.preventDefault();
        let x = event.pageX;
        let y = event.pageY
        // flip the y/x for other player and repaint the dragged object to the
        if (invertedBoard) {
            y = Math.abs(y - checkerBoardHeightY);
            x = Math.abs(x - checkerBoardWidthX);
        }
        let data = { piece: dragged.id, x: x, y: y, boardWidth: checkerBoardWidthX };
        sendXY(data);
    }, false);
    document.addEventListener("dragenter", function (event) {
        if (event.target.style) {
            event.target.style.opacity = .5;
        }
    }, false);
    document.addEventListener("dragleave", function (event) {
        if (event.target.style) {
            event.target.style.opacity = "";
            dragged.style.opacity = .5;
            slide.play();
        }
    }, false);

    let touchDragDiv = document.getElementById('touchDragDiv');
    let playSlideSound = true;
    /// Touch events for devices
    document.addEventListener('touchend', (event) => {
        //console.log("touchend");
        if (touchDragDiv.style.display === "none") {
            return;
        }
        var touchLocation = event.changedTouches[0];
        var pageX = touchLocation.pageX;
        var pageY = touchLocation.pageY;
        // hide the div before getting the location or location will be the div
        touchDragDiv.style.display = "none";
        touchDragDiv.style.left = '0px';
        touchDragDiv.style.top = '0px';
        destination = document.elementFromPoint(pageX, pageY);
        if (touchDragDiv.hasChildNodes()) {
            touchDragDiv.childNodes.forEach((node, index) => {
                touchDragDiv.removeChild(node);
            });
        }
        sendDrop(touchLocation.target, destination.id);
        playSlideSound = true;
    });

    document.addEventListener('touchmove', (event) => {
        //event.preventDefault();
        //console.log("touchmove");
        let touch = event.targetTouches[0];
        // console.log(touch.target.classList);
        if (!touch.target.classList.contains("checkerpiece")) {
            return;
        }
        touch.target.style.opacity = .5;
        let offsetX = parseInt(touch.target.style.width, 10) / 2;// to center piece on touch spot
        let offsetY = offsetX + offsetX * .5;
        let pageX = touch.pageX;
        let pageY = touch.pageY;
        if (!touchDragDiv.hasChildNodes()) {
            touchDragDiv.append(document.getElementById(touch.target.id).cloneNode(false));
        }
        touchDragDiv.style.display = "block";
        touchDragDiv.style.left = pageX - offsetX + 'px';
        touchDragDiv.style.top = pageY - offsetY + 'px';
        // if board is inverted send opposite vertical spot, size calc is handled on other board
        if (invertedBoard) {
            pageY = Math.abs(pageY - checkerBoardHeightY);
            pageX = Math.abs(pageX - checkerBoardWidthX);
        }
        let data = { piece: touch.target.id, x: pageX, y: pageY, boardWidth: checkerBoardWidthX };
        sendXY(data);

        if (playSlideSound) {
            slide.play();
        }
        playSlideSound = false;
    });

}