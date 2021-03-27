// intended globals
var url = window.location.href;
let socket = io.connect(url);

/// divs and fields and such
const loginDiv = document.getElementById('login_div');
const checkerboard = document.getElementById("checkerboard");
const playerNameElement = document.getElementById("playerName");
const storedPlayerNameElement = document.getElementById("storedPlayerName");
const storedPlayerIdElement = document.getElementById("storedPlayerId");
const messageDiv = document.getElementById("messageDiv");
const userSelectDiv = document.getElementById("user_select_div");
const userSelectHeader = document.getElementById('user_select_header');
const userSelectDisplay = document.getElementById('user_select_display');
const poolButton = document.getElementById("pool_btn");

const backGroundColorButton = document.getElementById("background-color");
const noPlaySquareColorButton = document.getElementById("no-play-square-color");
const playSquareColorButton = document.getElementById("play-square-color");

// checkerBoardWidthX Height used in move calculations to determine distance size, etc. (they should be same)
let checkerBoardWidthX = checkerboard.offsetWidth;
let checkerBoardHeightY = checkerboard.offsetWidth;
// playerNumber used to determine the direction of the board and such.
let invertedBoard = false;

// sounds
var tap = new Audio('/sounds/tap.mp3');
var slide = new Audio('/sounds/slide.mp3');
var king = new Audio('/sounds/king.mp3');
var cheer = new Audio('/sounds/cheer.mp3');
var fail = new Audio('/sounds/fail.mp3');

function showMenu(id) {
    if (id == undefined) {
        document.getElementById("myDropdown").classList.toggle("show");
    } else {
        theStyle = document.getElementById(id);
        theStyle.style.display === 'none' ? theStyle.style.display = 'block' : theStyle.style.display = 'none';
    }
}

function setUpColorMenu(element){
    noPlaySquareColorButton.style.backgroundColor = "";
    noPlaySquareColorButton.style.color = "";
    playSquareColorButton.style.backgroundColor= "";
    playSquareColorButton.style.color = "";
    backGroundColorButton.style.backgroundColor = "";
    backGroundColorButton.style.color = "";
    if (element && element.id ==="play-square-color" ){
        playSquareColorButton.style.backgroundColor = "black";
        playSquareColorButton.style.color = "white";
    } else if (element && element.id === "no-play-square-color"){
        noPlaySquareColorButton.style.backgroundColor = "black";
        noPlaySquareColorButton.style.color = "white";
    } else {
        backGroundColorButton.style.backgroundColor = "black";
        backGroundColorButton.style.color = "white";
    }
}
setUpColorMenu();
function changeSelectedColor(color){
    const rbs = document.querySelectorAll('input[name="section-to-color"]');
    let selectedValue;
    for (const rb of rbs) {
        if (rb.checked) {
            selectedValue = rb.id;
            break;
        }
    }
    if (playSquareColorButton.style.backgroundColor === "black"){
        changePlaysquareColor(color);
    } else if (noPlaySquareColorButton.style.backgroundColor === "black"){
        changeOffsquareColor(color);
    } else {
        changeBackgroundColor(color);
    }
}

function changeBackgroundColor(color) {
    let root = document.documentElement;
    root.style.setProperty('--default-color', color);
    if (typeof (Storage) !== "undefined") {
        try {
            localStorage.setItem("s-color", color);
        } catch (err) {
            console.log(err);
        }
    }
}

function changePlaysquareColor(color) {
    let root = document.documentElement;
    root.style.setProperty('--play-square-color', color);
    if (typeof (Storage) !== "undefined") {
        try {
            localStorage.setItem("s-playsquare-color", color);
        } catch (err) {
            console.log(err);
        }
    }
}

function changeOffsquareColor(color) {
    let root = document.documentElement;
    root.style.setProperty('--off-square-color', color);
    if (typeof (Storage) !== "undefined") {
        try {
            localStorage.setItem("s-offsquare-color", color);
        } catch (err) {
            console.log(err);
        }
    }
}

window.onclick = function (event) {
    let target = event.target;
    if (!target.matches('.dropbtn') && !target.matches('.dropMenuItem') && !target.matches('.dropbtnimg')) {
        closeMenu();
    }
}

function closeMenu() {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        // console.log(openDropdown);
        if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
        }
    }
    document.getElementById('color_menu').style.display = 'none';
}

function logOut(){
    resetUpdatePoolMonitor();
    disconnect();
    userSelectDiv.style.display = "none";
    checkerboard.style.display = "none";
    loginDiv.style.display = "none";
    messageDiv.style.display = "block";
    messageDiv.innerHTML = "You have been logged out. Click Home on the menu to reconnect.";
    storedPlayerIdElement.value = "";
    storedPlayerNameElement.value = "";
    closeMenu();
}

function logIn(){
    resetUpdatePoolMonitor();
    disconnect();    
    reconnect();
    userSelectDiv.style.display = "none";
    checkerboard.style.display = "none";
    loginDiv.style.display = "block";
    messageDiv.style.display = "none";
    messageDiv.innerHTML = "";
    closeMenu();
    playerNameElement.focus();
}

function getLocalStorage() {
    if (typeof (Storage) !== 'undefined') {
        try {
            let root = document.documentElement;
            let color = localStorage.getItem('s-color');
            if (color !== undefined && color != null) {
                root.style.setProperty('--default-color', color);
            }
            color = localStorage.getItem('s-offsquare-color');
            if (color !== undefined && color != null) {
                root.style.setProperty('--off-square-color', color);
            }
            color = localStorage.getItem('s-playsquare-color');
            if (color !== undefined && color != null) {
                root.style.setProperty('--play-square-color', color);
            }
            let name = localStorage.getItem('s-playerName');
            if (name != undefined && name != null) {
                playerNameElement.value = name;
            }
        } catch (err) {
            console.log(err);
        }
    }
}
getLocalStorage();

function focusOnName(){
    playerNameElement.focus(); 
    var val = playerNameElement.value; 
    playerNameElement.value = ''; 
    playerNameElement.value = val; 
}
focusOnName(); 