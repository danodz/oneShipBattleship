const fs = require('fs');
const express=require('express'); 
const socketIO=require('socket.io'); 
const http=require('http') 
const port=process.env.PORT||3000 
var app=express(); 
var server = http.createServer(app) 
var io=socketIO(server); 

var player1 = {
    name: "player1",
};
var noPlayer1 = true;

var player2 = {
    name: "player2",
};
var noPlayer2 = true;

player1.enemy = player2;
player2.enemy = player1;

app.get("/", (req,res) => {
    res.send(fs.readFileSync("index.html").toString());
});
  
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
    player.socket = socket;
    console.log(player.name + " connected"); 
    
    socket.emit('name', player.name); 
    
    // listen for message from user 
    socket.on('setBoard', (msg)=>{ 
        player.board = JSON.parse(msg);
        console.log(player.board);
    }); 

    socket.on("move", (position)=>{
        let pos = position.split(",");
        let x = parseInt(pos[0]);
        let y = parseInt(pos[1]);
        let data = {
            x: x,
            y: y,
            value: player.enemy.board[x][y]
        };
        player.enemy.socket.emit("playerUpdate", data);
        player.socket.emit("enemyUpdate", data);
    })
    
  // when server disconnects from user 
    socket.on('disconnect', ()=>{ 
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
  
server.listen(port); 
