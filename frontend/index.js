////////////////////// GAME LOGIC //////////////////////
function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = unescape(dataURI.split(',')[1]);
    }

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:mimeString});
}


var sound0 = new Audio('../sounds/hihat-acoustic01.mp3');
var sound1 = new Audio('../sounds/tom-acoustic02.mp3');
var sound2 = new Audio('../sounds/kick-acoustic02.mp3');
var sound3 = new Audio('../sounds/snare-acoustic02.mp3');
var sound4 = new Audio('../sounds/cowbell-808.mp3');

var game = {
    polygons: [
                 [[0, 0], [0, 64*2], [64*2, 64*2], [64*2, 0]],
                 [[64*2, 192*2], [64*2, 239*2], [128*2, 239*2], [128*2, 192*2]],
                 [[128*2, 192*2], [128*2, 239*2], [192*2, 239*2], [192*2, 192*2]],
                 [[192*2, 192*2], [192*2, 239*2], [256*2, 239*2], [256*2, 192*2]],
                 [[256*2, 0], [256*2, 64*2], [320*2, 64*2], [320*2, 0]]
              ],

    moves: [
                {
                    time: 0,
                    color: "blue",
                    polygon: 0
                },

                {
                    time: 200,
                    color: "purple",
                    polygon: 4
                },

                {
                    time: 300,
                    color: "blue",
                    polygon: 2
                },

                {
                    time: 100,
                    color: "blue",
                    polygon: 3
                }
          ],
    polygonAudioMap: { 
                        0:sound0,
                        1:sound1,
                        2:sound2,
                        3:sound3,
                        4:sound4
                     } 
};

var game_state = {};

/** Resets the game. Should be called when you're starting a new game. */
function resetGamestate() {
    game_state = {
        last_time: 0,
        current_pos: 0,
        score: 0
    };
}

resetGamestate();

function setExampleTimeout(sound, time){
    setTimeout(function(){
        sound.play();
        //TODO: animateBox()
        console.log(sound);
        console.log("playing sound");
    }, time);
}

function playAudioExample(game) {
    var moves = game.moves;
    var pmap = game.polygonAudioMap;
    for (var i = 0; i < game.moves.length;i++){
        setExampleTimeout(pmap[moves[i].polygon], moves[i].time);
    }
}

// playAudioExample(game);

var socket = io({"transports": ["websocket"]});

socket.emit("new_game", game.polygons);

var gUM = Modernizr.prefixed("getUserMedia", navigator);
var video = document.getElementById("live");
var canvas = document.getElementById("process");
var ctx = canvas.getContext("2d");

// for video error
var errorCallback = function(e) {
    console.log('webcam video error!', e);
};

var videoConstraints = {
  video: {
    mandatory: {
      minWidth: 320*2,
      minHeight: 240*2
    }
  }
};

gUM(videoConstraints, function(localMediaStream) {
    video.src = window.URL.createObjectURL(localMediaStream);
}, errorCallback);

setInterval(function() {
    ctx.drawImage(video, 0, 0, 320*2, 240*2);
    var data = canvas.toDataURL('image/jpeg', 1.0);
    socket.emit("frame", dataURItoBlob(data));
}, 230);

socket.on("sound", function(hit) {
    var timecode = new Date().getTime();
    var soundID = hit.soundID;
    var color = hit.color;

    switch (soundID) {
        case 0:
            var sound = new audio('../sounds/hihat-acoustic01.mp3');
            break;
        case 1:
            var sound = new Audio('../sounds/tom-acoustic02.mp3');
            break;
        case 2:
            var sound = new Audio('../sounds/kick-acoustic02.mp3');
            break;
        case 3:
            var sound = new Audio('../sounds/snare-acoustic02.mp3');
            break;
        case 4:
            var sound = new Audio('../sounds/cowbell-808.mp3');
            break;
    }
    sound.play();

    blinkRectangle(game, soundID, color);

    var current_move = game.moves[game_state.current_pos];

    if ((current_move.color == color) && (current_move.polygon = soundID)) {
        if (game_state.current_pos > 0) {
            var diff = Math.abs(timecode - game_state.last_time);
            if ((.1 * current_move.time) > diff) {
                game_state.current_score += 1000;
            } else if ((.25 * current_move.time) > diff) {
                game_state.current_score += 500;
            } else if ((.5 * current_move.time) > diff) {
                game_state.current_score += 250;
            } else if (current_move.time > diff) {
                game_state.current_score += 150;
            } else {
                game_state.current_score += 100;
            }
        }
        game_state.last_time = new Date().getTime();
        game_state.current_pos += 1;
    }


});

////////////////////// DISPLAY //////////////////////
var display = document.getElementById('display');
var displayContext = display.getContext('2d');

//intermediate canvas. never rendered. used for calculations
var back = document.createElement('canvas');
var backcontext = back.getContext('2d');

var cw,ch;

var toDraw = [];

/** Sets up the toDraw. Takes the game var. */
function setupToDraw(game) {
    for (var index in game.polygons) {
        polygon = game.polygons[index];
        toDraw.push(
                {
                    polygon: polygon,
                    color: "red",
                    stroke: 2,
                    time: 0
                }
        );
    }
}

setupToDraw(game);

/** Blinks the rectangle, give it an id a game, and a string of color */
function blinkRectangle(game, id, color) {
    var polygon = game.polygons[id];
    toDraw.push(
            {
                polygon: polygon,
                color: color,
                stroke: 3,
                time: 50
            }
    );
}

//setting it and intermediate canvas to same frame size

cw = 320 *2;
ch = 240 *2;
display.width = cw;
display.height = ch;
back.width = cw;
back.height = ch;

draw(video,displayContext,backcontext,cw,ch);


// “backing canvas”, which performs any intermediate operations 
// before painting the final result into the visible canvas in the markup. 
function draw(v,c,bc,w,h) {
    // First, draw it into the backing canvas
    bc.drawImage(v,0,0,w,h);
    // Grab the pixel data from the backing canvas
    var idata = bc.getImageData(0,0,w,h);

    // any image manipulations here

    // Draw the pixels onto the visible canvas
    c.putImageData(idata,0,0);
    // keep drawing while video plays
    setTimeout(function(){ 
        draw(v,c,bc,w,h); 
        for (var index in toDraw) { //starts at 0
            var elem = toDraw[index];
            drawRectangle(elem.polygon[0], elem.polygon[1], elem.polygon[2], elem.polygon[3],
                elem.color, c, elem.stroke);
            if (elem.time == 1) {
                toDraw.splice(index, 1);
            }
            if (elem.time > 0) {
                elem.time -= 1;
            }
        }
    }, 0);
}

/*
    given, 4 points of xy coordinates [x,y],
    color (string),
    stroke (int),
    draws a rectangle onto canvas display
*/
function drawRectangle(point1, point2, point3, point4, color, ctx, stroke) {
    ctx.beginPath();
    ctx.lineWidth = stroke;
    ctx.strokeStyle = color;
    ctx.rect(point1[0], point1[1], Math.abs(point4[0]-point1[0]), Math.abs(point1[1] - point2[1])); 
    ctx.stroke();
}

////////////////////// UI //////////////////////
$('.btn').click(function(e) {
    e.preventDefault();
    $(this).addClass('active');
    $(this).siblings().removeClass('active');

    if ($(this).attr('id') == "freestyle") {
        vex.dialog.alert('Play whatever you want!');
    } else {
        vex.dialog.confirm({
          message: 'This song pattern will now play. Ready to watch carefully and repeat after me?',
          callback: function(value) {
            // value = true if the person clicked "ok"
            
            return console.log(value);
          }
        });
    }
})
