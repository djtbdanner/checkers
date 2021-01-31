// intended globals

var url = window.location.href;
let socket = io.connect(url);

// checkerBoardWidthX Height used in move calculations to determine distance size, etc. (they should be same)
let checkerBoardWidthX = document.getElementById("checkerboard").offsetWidth;
let checkerBoardHeightY = document.getElementById("checkerboard").offsetWidth;
// playerNumber used to determine the direction of the board and such.
let invertedBoard = false;

// sounds
var tap = new Audio('/sounds/tap.mp3');
var slide = new Audio('/sounds/slide.mp3');
var king = new Audio('/sounds/king.mp3');
var cheer = new Audio('/sounds/cheer.mp3');

/// divs and fields and such
const loginDiv = document.getElementById('login_div');
const checkerboard = document.getElementById("checkerboard");
const playerNameElement = document.getElementById("playerName");
const loginButton = document.getElementById("login_btn");
const messageDiv = document.getElementById("messageDiv");

function showMenu(id) {
    if (id == undefined) {
        document.getElementById("myDropdown").classList.toggle("show");
    } else {
        theStyle = document.getElementById(id);
        theStyle.style.display === 'none' ? theStyle.style.display = 'block' : theStyle.style.display = 'none';
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

playerNameElement.addEventListener("keyup", event => {
    if (event.key !== "Enter") return;
    loginButton.click();
    event.preventDefault();
});

function logOut(){
    disconnect();
    loginDiv.style.display = "block";
    checkerboard.style.display = "none";
    checkerboard.style.display = "none";
    messageDiv.style.display = "none";
    messageDiv.innerHTML = "";
    closeMenu();
    reconnect();
    
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