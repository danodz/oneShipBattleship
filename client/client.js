var gameStatusTxt;
var connectionStatusTxt;
var gameState = "setup";
var socket=io() 
socket.on('name', function(msg){ 
    connectionStatusTxt.innerText = msg;
}); 
socket.on('disconnect', function(){ 
    connectionStatusTxt.innerText = "Disconnected from server";
}); 
  
socket.on('enemyUpdate', function(msg){ 
    gridUpdate(enemyGrid, msg.x, msg.y, msg.value)
}); 

socket.on('playerUpdate', function(msg){ 
    gridUpdate(playerGrid, msg.x, msg.y, msg.value)
}); 

socket.on('boardError', function(){ 
    document.querySelector(".boardError").classList.remove("hidden");
}); 

socket.on('boardOk', function(){ 
    document.querySelector(".playerGrid").classList.add("locked");
    document.querySelector(".boardError").classList.add("hidden");
    document.querySelector(".ready").classList.add("hidden");
    gameState = "";
}); 

socket.on("setGameState", function(msg){
    gameState = msg;
    gameStatusTxt.innerText = msg;
});

socket.on("gameOver", function(msg){
    const node = document.querySelector(".gameOver");
    node.classList.remove("hidden");
    node.innerText = msg + " Won!";
});

socket.on("nope", function(){
    document.body.innerHTML = "NOPE!";
});

function gridUpdate(grid, x, y, value){
    if(value == "boat")
    {
        grid[x][y].style.background = "red";

        tempDisplay(document.querySelector(".moveFeedback .hitTxt"));
    }
    else if(value == "mermaid" || value == "crab")
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

var displaying;
var timeout;
function tempDisplay(e){
    if(displaying){
        displaying.style.display = "none";
        clearTimeout(timeout);
    }
    e.style.display="block";
    displaying = e;
    timeout = setTimeout(()=>{
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
    gameStatusTxt = document.querySelector(".gameStatus");
    connectionStatusTxt = document.querySelector(".connectionStatus");

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

            var mermaid = document.createElement("div");
            mermaid.className = "decoy mermaid";
            mermaid.innerText = "S";
            item.appendChild(mermaid);

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
        e.currentTarget.classList.add("boat");
    }
    else if(e.currentTarget.dataset.contains == "boat")
    {
        e.currentTarget.dataset.contains = "mermaid";
        e.currentTarget.classList.remove("boat");
        e.currentTarget.querySelector(".mermaid").style.display = "block"
    }
    else if(e.currentTarget.dataset.contains == "mermaid")
    {
        e.currentTarget.dataset.contains = "crab";
        e.currentTarget.querySelector(".mermaid").style.display = "none"
        e.currentTarget.querySelector(".crab").style.display = "block"
    }
    else
    {
        e.currentTarget.dataset.contains = "empty";
        e.currentTarget.querySelector(".crab").style.display = "none"
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
    socket.emit('setBoard', JSON.stringify(board)); 
}

function reset(){
    socket.emit("reset");
}

socket.on("reset",function(){
    document.querySelector(".playerGrid").innerHTML = "";
    document.querySelector(".enemyGrid").innerHTML = "";
    document.querySelector(".playerGrid").classList.remove("locked");
    document.querySelector(".ready").classList.remove("hidden");
    document.querySelector(".gameOver").classList.add("hidden");
    init();
});
