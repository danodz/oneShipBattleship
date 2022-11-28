var player;
var gameState = "setup";

var socket=io() 
socket.on('name', function(msg){ 
    console.log(msg);
    player = msg;
}); 
socket.on('disconnect', function(){ 
  console.log('Disconnected from server') 
}); 
  
socket.on('enemyUpdate', function(msg){ 
    gridUpdate(enemyGrid, msg.x, msg.y, msg.value)
}); 

socket.on('playerUpdate', function(msg){ 
    gridUpdate(playerGrid, msg.x, msg.y, msg.value)
}); 

function gridUpdate(grid, x, y, value){
    if(value == "boat")
    {
        grid[x][y].style.background = "red";

        tempDisplay(document.querySelector(".moveFeedback .hitTxt"));
    }
    else if(value == "siren" || value == "crab")
    {
        grid[x][y].style.background = "red";
        fadeIn(grid[x][y].querySelector("."+value))

        tempDisplay(document.querySelector(".moveFeedback .hitTxt"));
        fadeIn(document.querySelector(".moveFeedback .hitTxt ." + value));
    }
    else if(value == "empty")
    {
        grid[x][y].style.background = "blue";

        tempDisplay(document.querySelector(".moveFeedback .missTxt"));
    }
}

function tempDisplay(e){
    e.style.display="block";
    setTimeout(()=>{
        e.style.display = "none";
    }, 5000);
}

function fadeIn(e){
    setTimeout(()=>{
        let opacity = 0;
        let interval = setInterval(()=>{
            e.style.display="block";
            e.style.opacity=opacity;
            opacity += 0.01;
            if(opacity >= 1)
                clearInterval(interval);
        }, 50);
    }, 1000);
}

function sendMove(e){
    socket.emit("move", e.currentTarget.dataset.position)
}

function init(){
    playerGrid = makeGrid(document.querySelector(".playerGrid"), changeTile);
    enemyGrid = makeGrid(document.querySelector(".enemyGrid"), sendMove);
}

function makeGrid(root, clickFn){
    var grid = [];
    for(var i=0; i<10; i++){
        grid[i] = [];
        var row = document.createElement("div");
        row.className = "row";
        for(var j=0; j<10; j++){
            var item = document.createElement("div");
            grid[i][j] = item
            item.className = "gridItem";
            item.dataset.position = [i,j]
            item.dataset.contains = "empty";
            item.onclick = clickFn

            var siren = document.createElement("div");
            siren.className = "decoy siren";
            siren.innerText = "S";
            item.appendChild(siren);

            var crab = document.createElement("div");
            crab.className = "decoy crab";
            crab.innerText = "C";
            item.appendChild(crab);

            row.appendChild(item);
        }
        root.appendChild(row);
    }
    return grid;
}

function changeTile(e){
    if(gameState != "setup")
        return;

    if(e.currentTarget.dataset.contains == "empty")
    {
        e.currentTarget.dataset.contains = "boat";
        e.currentTarget.style.background = "black"
    }
    else if(e.currentTarget.dataset.contains == "boat")
    {
        e.currentTarget.dataset.contains = "siren";
        e.currentTarget.style.background = "none"
        e.currentTarget.querySelector(".siren").style.display = "block"
    }
    else if(e.currentTarget.dataset.contains == "siren")
    {
        e.currentTarget.dataset.contains = "crab";
        e.currentTarget.querySelector(".siren").style.display = "none"
        e.currentTarget.querySelector(".crab").style.display = "block"
    }
    else
    {
        e.currentTarget.dataset.contains = "empty";
        e.currentTarget.querySelector(".crab").style.display = "none"
        e.currentTarget.style.background = "none"
    }
}

function sendGrid(){
    if(gameState != "setup")
        return;

    let board = [];
    for(var i=0; i<playerGrid.length; i++){
        board[i] = [];
        for(var j=0; j<playerGrid[i].length; j++){
            board[i][j] = playerGrid[i][j].dataset.contains
        }
    }
    
    gameState = "";
    socket.emit('setBoard', JSON.stringify(board)); 
}

