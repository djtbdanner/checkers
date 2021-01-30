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

/// divs an fields and such
const loginDiv = document.getElementById('login_div');
let checkerboard = document.getElementById("checkerboard");
let playerNameElement = document.getElementById("playerName");
let loginButton = document.getElementById("login_btn");

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

function getLocalStorage() {
    if (typeof (Storage) !== 'undefined') {
        try {
            let color = localStorage.getItem('s-color');
            if (color !== undefined && color != null) {
                let root = document.documentElement;
                root.style.setProperty('--default-color', color);
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
    playerNameElement.focus(); //sets focus to element
    var val = playerNameElement.value; //store the value of the element
    playerNameElement.value = ''; //clear the value of the element
    playerNameElement.value = val; //set that value back. 
}
focusOnName(); 