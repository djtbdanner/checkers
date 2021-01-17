function drawCheckerBoard() {
    var checkerboard = document.getElementById("checkerboard");
    var table = document.createElement("table");
    table.draggable = false;
    var row;
    var rowNumber = 0;
    var columnNumber = 0;
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
                tableData.style.backgroundColor = "#9B1517";
                // tableData.draggable = true;
            } else {
                tableData.style.backgroundColor = "gray";
            }
        } else {
            if (i % 2 != 0) {
                tableData.style.backgroundColor = "#9B1517";
                //   tableData.draggable = true;
            } else {
                tableData.style.backgroundColor = "gray";
            }
        }
        tableData.innerHTML = '&nbsp;';
        tableData.id = rowNumber + '_' + columnNumber;
        columnNumber = columnNumber + 1;
        row.appendChild(tableData);
    }
    checkerboard.appendChild(table);
    addListeners();
}
init();

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
            if (piece.king){
                imgName = "KingBlack.png"
            }
            if (piece.color === "R") {
                imgName = "Red.png"
                if (piece.king){
                    imgName = "KingRed.png"
                }
            }
            appendImage(square, imgName);
        });
    }
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
    // no earthly clue why these have to be reset.
    square.style.width = width + "px";
    square.style.height = height + "px";
    square.appendChild(img);
}


function movePiece(pieceData) {
    let data = JSON.parse(pieceData);
    let piece = document.getElementById(data.piece);
    let pieceWidth = piece.offsetWidth;
    let otherWidth = data.boardWidth;
    let percent = checkerBoardWidth/otherWidth;
    let x = Math.round(parseFloat(data.x) * percent) - Math.round(pieceWidth/2);
    let y = Math.round(parseFloat(data.y) * percent) - Math.round(pieceWidth/2);
    let pos = piece.style.position;
    piece.style.position = "absolute";
//    console.log(JSON.stringify(data) + `x = ${x}, y = ${y}, percent =${percent} otherwidth =${otherWidth} width = ${checkerBoardWidth}`);
    piece.style.top = y + "px";
    piece.style.left = x + "px";
}

function addListeners() {
    /// -- Drag event processing for desktop screens
    let dragged = {};
    document.addEventListener('drop', (event) => {
        event.preventDefault();
        if (event.target.style) {
            event.target.style.opacity = "";
        }
        sendDrop(dragged, event.target.id);
    }, false);
    document.addEventListener('dragstart', (event) => {
        dragged = event.target;
        dragged.style.opacity = .5;
    }, false);
    document.addEventListener("dragover", function (event) {
        event.preventDefault();
        let data = { piece: dragged.id, x: event.pageX, y: event.pageY,  boardWidth: checkerBoardWidth };
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
        }
    }, false);

    let touchDragDiv = document.getElementById('touchDragDiv');
    /// Touch events for devices
    document.addEventListener('touchend', (event) => {
        // console.log("touchend");
        var touchLocation = event.changedTouches[0];
        var pageX = touchLocation.pageX;
        var pageY = touchLocation.pageY;
        // hide the div befor getting the location or location will be the div
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
    });

    document.addEventListener('touchmove', (event) => {
        // console.log("touchmove");
        let touch = event.targetTouches[0];
        console.log(touch)
        touch.target.style.opacity = .5;
        // console.log(touch.target.id);
        event.preventDefault();
        let pageX = touch.pageX;
        let pageY = touch.pageY;
        if (!touchDragDiv.hasChildNodes()) {
            touchDragDiv.append(document.getElementById(touch.target.id).cloneNode(false));
        }
        touchDragDiv.style.display = "block";
        touchDragDiv.style.left = pageX - 50 + 'px';
        touchDragDiv.style.top = pageY - 50 + 'px';
        // console.log(touchDragDiv.style.top);
        let data = { piece: touch.target.id, x: pageX, y: pageY, boardWidth: checkerBoardWidth };
        console.log('y  ' + JSON.stringify(data));
        sendXY(data);
    });

}

function fade(element) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 100);
}

function unfade(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1) {
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 10);
}