var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var cookieParser = require('cookie-parser');
app.use(cookieParser());




//app.use(session({
   // secret: 'ssshhhhh',
   // store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
   // saveUninitialized:false,
    //resave:false
//}));

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));



app.get('/',function(req, res) {
    res.cookie('loggedIn', "false");
  
    res.sendFile(__dirname + '/client/homepage.html');
});
app.get('/entry.html',function(req, res) {
  
    res.sendFile(__dirname + '/client/entry.html');
});
app.get('/index.html',function(req, res) {
    res.cookie('usern', req.query.name);
    res.cookie('loggedIn', "true")
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/login.html',function(req, res) {
    res.sendFile(__dirname + '/client/login.html');
});

app.get('/homepage.html',function(req, res) {
    res.sendFile(__dirname + '/client/homepage.html');
});

app.get('/spaceship1.jpg', function(req,res){
    res.sendFile(__dirname + '/images/spaceship1.jpg')
})

app.get('/laserB.png', function(req, res){
    res.sendFile(__dirname + '/images/laserB.png')
})

app.get('/laserG.png', function(req,res){
    res.sendFile(__dirname + '/images/laserG.png')
})

app.get('/spaceship2.jpg', function(req,res){
    res.sendFile(__dirname + '/images/spaceship2.jpg')
})

app.get('/space.jpg', function(req,res){
    res.sendFile(__dirname + '/images/space.jpg')
})



app.get('/ghost.png', function(req,res){
    res.sendFile(__dirname + '/images/ghost.png')
})

app.get('/ghost1.png', function(req,res){
    res.sendFile(__dirname + '/images/ghost1.png')
})

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.createCollection("customers", function(err, res) {
      if (err) throw err;
      
      db.close();
    });
  });

serv.listen(2000);
console.log("Server started.");
var SOCKET_LIST = [];
var PARTNERS_LIST = []; 
var levelDesigner = [
    [1,5],
    [2,5],
    [2,10],
    [3,10],
    [3,15],
];






var Sprite = function(x, y, type, imgSrc,  width, height, id, direction, row, line){
    var self = {
        x:x,
        y:y,
        id:id,
        width:width,
        height:height,
        type:type,
        imgSrc:imgSrc,
        direction:direction,
        row:row,
        line:line,
        counter:0,
    }
    self.updatePosition = function(x){
        self.y += x;
    }
    return self;
}

var Player = function(x, y, id,imgSrc, width, height, playNum, usern){
    var self = {
        x:x,
        y:y,
        id:id,
        width:width,
        height:height,
        imgSrc:imgSrc,
        playNum:playNum,
        pressingRight:false,
        pressingLeft:false,
        pressingUp:false,
        pressingDown:false,
        maxSpd:5,
        counter:0,
        
    }
    self.updatePosition = function(){
        if(self.pressingRight)
            self.x += self.maxSpd;
        if(self.pressingLeft)
            self.x -= self.maxSpd;
    }

    return self;
}

class Pack {
    constructor(socket1, player1){
        this.Socket = socket1;
        this.Player = player1;
    }

    get socket(){
        return this.Socket;
    }

    get player(){
        return this.Player;
    }
}




var Partner = function(pack1, pack2,){
    var self = {
        pack1:pack1,
        pack2:pack2,
        SPRITE_LIST:[],
        currentlvl:1,
        nextlvl:false,
        intervalList:[],
        gameActive:true,
        stateOfGame:'',
    }

    self.insertToSprite = function(spr){
        self.SPRITE_LIST[self.SPRITE_LIST.length] = spr
    }
    self.updateGhostPosition = function(){
            var outofboundaries = false;
            var direc;
            var checkNextLvl = true;
            temp= self.SPRITE_LIST;
            for (var i = 0 ; i<temp.length ; i++){
                if (temp != null){
                    if(temp[i] != null){
                        if(temp[i].type == "ghost"){
                            checkNextLvl = false;
                        }
                    }
                }
            }
            if (checkNextLvl == true){self.nextlvl = true;}
            for (var i = 0 ; i<temp.length ; i++){
                if (temp[i] != null){
                    if(temp[i].type == "ghost"){
                        if (temp[i].y >= 650){
                            self.gameActive = false;
                            self.stateOfGame = 'lost'
                            break;
                        }
                        if(temp[i].x <= 100){
                            outofboundaries = true;
                            direc = "right";
                        }
                        if(temp[i].x >= 1100){
                            outofboundaries = true;
                            direc = "left";
                        }


                        }
                }
                   }  
                for (var i = 0 ; i<temp.length ; i++){
                    if (temp[i] != null ){
                        if(temp[i].type == "ghost"){
                        if (outofboundaries && direc == "left"){
                            temp[i].y += 25;
                            temp[i].x -= 50
                            temp[i].direction = "left";
                        }
                        else if (outofboundaries && direc == "right"){
                            temp[i].y += 25;
                            temp[i].x += 50
                            temp[i].direction = "right";
                        }
                        else{
                            if (temp[i].direction == "right" ){ 
                                temp[i].x += 50;
                            }
                             if (temp[i].direction == "left" ){
                                temp[i].x -= 50;
                            }
                        }
                    }
                    }
                }
            
    }
    return self;
}




var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    var timeoutlist = [];
    var player;
    var windowWidth,windowHeight;
    socket.on('signIn',function(data){
        var truecredentials = false;
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            var userns = dbo.collection("customers").find().toArray();
            var myobj = {name : data.username, password:data.password};
            userns.then(function(result){
                for (var i in result){
                    if(result[i].name==myobj.name && result[i].password == myobj.password){
                        truecredentials = true;
                    }
                }
                socket.emit('signInResponse',{success:truecredentials, usern:myobj.name});
            })
        });
    })

    socket.on('signUp',function(data){  
        MongoClient.connect(url, function(err, db) {
            var usernametaken = true;
            if (err) throw err;
            var dbo = db.db("mydb");
            var userns = dbo.collection("customers").find().toArray();
            var myobj = {name : data.username, password:data.password};
            userns.then(function(result){
                for(var i in result){
                    if (result[i].name==myobj.name){
                        usernametaken = false;
                    }
                }
                if(usernametaken){
                    dbo.collection("customers").insertOne(myobj, function(err, res){
                        if (err) throw err;
                    db.close();
                    })
                }
                socket.emit('signUpResponse',{success:usernametaken});
            })
        });
    });


    socket.on('sortToPartners',function(data){  
        windowWidth = data.windowX;
        windowHeight = data.windowY;
        socket.id = SOCKET_LIST.length;
        SOCKET_LIST[socket.id] = socket;  
        var last_element = PARTNERS_LIST[PARTNERS_LIST.length - 1];
        if (last_element == null){
            player = Player(500, windowHeight-150 ,socket.id, '/spaceship1.jpg', 100, 100, 1, null);
            newPack = new Pack(socket, player);
            PARTNERS_LIST[0] = Partner(newPack, null);
            partnerId = 0;
            numPack = 0;
            partnering = PARTNERS_LIST[partnerId];
            socket.emit('playerDecide',{playn:"1"});
        }
        else if (last_element.pack2 == null){
            player = Player(900, windowHeight-150,socket.id, '/spaceship2.jpg', 100, 100, 2, null);
            newPack = new Pack(socket, player);
            PARTNERS_LIST[PARTNERS_LIST.length-1].pack2 = newPack;
            partnerId = PARTNERS_LIST.length-1;
            numPack = 1;
            partnering = PARTNERS_LIST[partnerId];
            socket.emit('playerDecide',{playn:"2"});
            createGhosts(levelDesigner[0][0],levelDesigner[0][1]);
            partnering.intervalList[0] = setInterval(updateGhost,1000);
            partnering.intervalList[1] = setInterval(sendLaser, 10000);  
        }
        else {
            player = Player(500, windowHeight-150, socket.id, '/spaceship1.jpg', 100, 100, 1, null);
            newPack = new Pack(socket, player);
            partnerId = PARTNERS_LIST.length;
            PARTNERS_LIST[PARTNERS_LIST.length] =Partner(newPack, null);
            numPack = 0;
            partnering = PARTNERS_LIST[partnerId];
            socket.emit('playerDecide',{playn:"1"});
        }
          });
        
        socket.on('createusern',function(data){
            player.usern = data.usern;
       
        })
    
    
        
        socket.on('laserCreate',function(){
            var laser = Sprite(player.x,550,"laser",'/laserG.png', 50, 100, partnering.SPRITE_LIST.length);
            partnering.insertToSprite(laser);
        })
       
        socket.on('keyPress',function(data){
            if(data.inputId === 'left')
                player.pressingLeft = data.state;
            else if(data.inputId === 'right')
                player.pressingRight = data.state;
            else if(data.inputId === 'up')
                player.pressingUp = data.state;
            else if(data.inputId === 'down')
                player.pressingDown = data.state;
        });
    
        socket.on('laserDelete',function(data){

            delete partnering.SPRITE_LIST[data.inputId];
        })
    
        socket.on('ghostDelete',function(data){ 
            partnering.aliveGhosts--;
            delete partnering.SPRITE_LIST[data.inputId2];
        })

        socket.on('createNewGhosts',function(){ 
            clearInterval(timeoutlist[0]);
            partnering.currentlvl++;
            partnering.nextlvl = false;
            console.log(partnering.currentlvl);
            if (partnering.currentlvl == 6){
                partnering.gameActive = false;
                partnering.stateOfGame = 'won'
            }
            createGhosts(levelDesigner[partnering.currentlvl-1][0],levelDesigner[partnering.currentlvl-1][1],);
        })

        socket.on('initiateLost',function(){
            partnering.gameActive = false;
            partnering.stateOfGame = 'lost'
        })

        
    
        function createGhosts(a,b){
            for (var i = 0 ; i < a ; i++){
                for (var j = 0 ; j < b ; j++){
                    var Ghost = Sprite(300 + 100*j,100 + 100*i,"ghost",'/ghost1.png', 75, 75, partnering.SPRITE_LIST.length, 'right', i, j);
                    partnering.insertToSprite(Ghost);
                }
            }
        }
    


        function updateGhost(){
            for (var i = 0 ; i<PARTNERS_LIST.length; i++){
                if (PARTNERS_LIST[i] != null){
                PARTNERS_LIST[i].updateGhostPosition()
                }
            }
        }



        function sendLaser(){  
            num = Math.floor(Math.random() * (howManyAliveGhosts(partnering.SPRITE_LIST)-1 - 0)) + 0;
            x = 0;
            y = 0;
            for(var i = 0 ; i<partnering.SPRITE_LIST.length; i++){
                if (partnering.SPRITE_LIST[i] != null){
                    if (partnering.SPRITE_LIST[i].type == "ghost" ){
                        if (num ==0 ){
                            x = partnering.SPRITE_LIST[i].x;
                            y = partnering.SPRITE_LIST[i].y;
                            break;
                        }
                        else{
                            num = num-1;
                           
                        }
                    }
                }
            }
            var laser = Sprite(x,y+100,"badLaser",'/laserB.png',50,100,partnering.SPRITE_LIST.length)
            partnering.insertToSprite(laser)
        }


        function howManyAliveGhosts(){
            var counter = 0;
            for(var i = 0 ; i<partnering.SPRITE_LIST.length; i++){
                if (partnering.SPRITE_LIST[i] != null){
                    if (partnering.SPRITE_LIST[i].type == "ghost" ){
                        counter++;
                    }
                }
            }
            return counter;
        }
    
     });


     
    
    







     
    setInterval(function(){
        
        for(var i in PARTNERS_LIST){
            if (PARTNERS_LIST[i] != null){
                pack = [];
                if (PARTNERS_LIST[i].pack1 != null && PARTNERS_LIST[i].pack2 != null){
                    if (PARTNERS_LIST[i].gameActive==false){

                        PARTNERS_LIST[i].pack1.socket.emit(PARTNERS_LIST[i].stateOfGame,);
                        PARTNERS_LIST[i].pack2.socket.emit(PARTNERS_LIST[i].stateOfGame,);
                        console.log('hey');
                        clearInterval(PARTNERS_LIST[i].intervalList[0]);
                        clearInterval(PARTNERS_LIST[i].intervalList[1]);
                        delete PARTNERS_LIST[i].pack1.player;
                        delete PARTNERS_LIST[i].pack2.player;
                        delete PARTNERS_LIST[i].pack1;
                        delete PARTNERS_LIST[i].pack2;
                        delete PARTNERS_LIST[i];
                      
                       


                    }
                    else if(PARTNERS_LIST[i].nextlvl == true){
                        PARTNERS_LIST[i].pack1.socket.emit('nextlvl',)
                        PARTNERS_LIST[i].nextlvl = false;
                    }
                    else{
                  
                    var player1 = PARTNERS_LIST[i].pack1;
                    player1.player.updatePosition();
                    pack.push({
                        x:player1.player.x,
                        y:player1.player.y,
                        imgSrc:player1.player.imgSrc,
                        height: player1.player.height,
                        width: player1.player.width,
                        type:'player',
                        usern:player1.player.usern,
                            
                    })
                    var spr_lst = PARTNERS_LIST[i].SPRITE_LIST
                    for (var j in spr_lst){
                        if (spr_lst[j] != null){
                            spr1 = spr_lst[j];
                            if (spr1.type == 'laser'){spr1.updatePosition(-10);}
                            if (spr1.type == 'badLaser'){spr1.updatePosition(10);}
                            pack.push({
                                x:spr1.x,
                                y:spr1.y,
                                imgSrc:spr1.imgSrc,
                                height:spr1.height,
                                width:spr1.width,
                                type:spr1.type,
                                id:spr1.id,
                            })
                        }
                    }
                    var player2 = PARTNERS_LIST[i].pack2;
                  
                    player2.player.updatePosition();
                    pack.push({
                        x:player2.player.x,
                        y:player2.player.y,
                        imgSrc:player2.player.imgSrc,
                        height:player2.player.height,
                        width: player2.player.width,
                        type:'player',
                        usern:player2.player.usern,
                    })
                    
                   
                  
                    player1.socket.emit('newPositions',pack)
                    player2.socket.emit('newPositions',pack)
                    }
                }
                    else if (PARTNERS_LIST[i].pack2 == null){
                        var player1 = PARTNERS_LIST[i].pack1;
                        player1.socket.emit('waitingGame',)
                        
                    }
                    else{
                        var player2 = PARTNERS_LIST[i].pack2;
                        player2.socket.emit('waitingGame',)
                    }
            
                }    
            }
        
        },1000/25);