const fs = require('fs');
const express=require('express'); 
const socketIO=require('socket.io'); 
const http=require('http') 
const port=process.env.PORT||3000 
var app=express(); 
var server = http.createServer(app) 

app.use(express.static('client'))

var io=socketIO(server); 

var player1 = {
    name: "player1",
};
var noPlayer1 = true;

var player2 = {
    name: "player2",
};
var noPlayer2 = true;

var gameState = "setup";
function setGameState(value){
    gameState = value;
    player1.socket.emit("setGameState", value)
    player2.socket.emit("setGameState", value)
}

player1.enemy = player2;
player2.enemy = player1;
  
// make connection with user from server side 
let players = [];
io.on('connection', (socket)=>{ 
    let player;
    if(noPlayer1)
    {
        player = player1;
        noPlayer1 = false;
    }
    else if(noPlayer2)
    {
        player = player2;
        noPlayer2 = false;
    }
    else
    {
        socket.emit("nope");
        return;
    }
    player.socket = socket;
    console.log(player.name + " connected"); 
    
    socket.emit('name', player.name); 
    
    // listen for message from user 
    socket.on('setBoard', (msg)=>{ 
        if(gameState == "setup")
        {
            var board = JSON.parse(msg).map(function(row){
                    return row.map(function(tile){
                        return {type: tile, played: false}
                    })
                });
            var boardIsValid = true;
            var boatLength = 0;

            function validateTile(i,j){
                function validate(x,y){
                    if(board[x] && board[x][y]){
                        if(board[x][y].type == "boat" && !board[x][y].valid){
                            validateTile(x, y);
                        }
                    }
                }
                board[i][j].valid = true;
                boatLength += 1;
                validate(i-1,j);
                validate(i+1,j);
                validate(i,j+1);
                validate(i,j-1);
            }

            let toBreak = false;
            for(var i=0; i<board.length; i++)
            {
                for(var j=0; j<board[i].length; j++)
                {
                    if(board[i][j].type == "boat"){
                        validateTile(i,j);
                        if(!board.every(function(row){
                            return row.every(function(tile){
                                return tile.type != "boat" || tile.valid;
                            });
                        })){
                            boardIsValid = false;
                        }
                        toBreak = true;
                        break;
                    }
                }
                if(toBreak) break;
            }

            if(boardIsValid && boatLength >= 2 && boatLength <= 10)
            {
                player.board = board;
                if(player.enemy.board)
                {
                    setGameState("player1");
                }
                socket.emit("boardOk");
            }
            else
            {
                socket.emit("boardError");
            }
        }
    }); 

    socket.on("move", (position)=>{
        if(gameState == player.name)
        {
            let pos = position.split(",");
            let x = parseInt(pos[0]);
            let y = parseInt(pos[1]);
            let tile = player.enemy.board[x][y]
            if(tile.played)
                return;
            tile.played = true;
            let data = {
                x: x,
                y: y,
                value: tile.type
            };

            let won = player.enemy.board.every(function(row) {
                return row.every(function(tile){
                    return tile.type != "boat" || tile.played;
                })
            })
            if(won){
                setGameState("gameOver");
                player.enemy.socket.emit("gameOver", player.name);
                player.socket.emit("gameOver", player.name);
            } else {
                setGameState(player.enemy.name);
            }
            player.enemy.socket.emit("playerUpdate", data);
            player.socket.emit("enemyUpdate", data);
        }
    })

    socket.on("reset", reset);
    
  // when server disconnects from user 
    socket.on('disconnect', ()=>{ 
        reset();
        if(player.name == "player1")
        {
           noPlayer1 = true;
        }
        else if(player.name == "player2")
        {
           noPlayer2 = true;
        }
    }); 
}); 

function reset(){
    setGameState("setup");
    player1.board = null;
    player2.board = null;
    player1.socket.emit("reset");
    player2.socket.emit("reset");
}
  
server.listen(port); 
