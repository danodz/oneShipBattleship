const fs = require('fs');
const express=require('express'); 
const socketIO=require('socket.io'); 
const http=require('http') 
const port=process.env.PORT||3000 
var app=express(); 
var server = http.createServer(app) 
var io=socketIO(server); 

var player1 = {
    name: "player1"
};
var noPlayer1 = true;

var player2 = {
    name: "player2"
};
var noPlayer2 = true;

app.get("/", (req,res) => {
    res.send(fs.readFileSync("index.html").toString());
});
  
// make connection with user from server side 
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
    console.log(player.name + " connected"); 
    
    socket.emit('name', player.name); 
    
    // listen for message from user 
    socket.on('setBoat', (msg)=>{ 
        player.boat = JSON.parse(msg);
        console.log(player.boat);
    }); 
    
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
