function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

var game = {
    polygons: [
                 [[0, 0], [0, 64], [64, 64], [64, 0]],
                 [[64, 192], [128, 192], [128, 239], [64, 239]],
                 [[128, 192], [192, 192], [192, 239], [128, 239]],
                 [[192, 192], [256, 192], [256, 239], [192, 239]],
                 [[256, 0], [256, 64], [320, 64], [320, 0]]
              ],

    moves: [
                {
                    time: 0,
                    color: "blue",
                    polygon: 0
                },

                {
                    time: 2000,
                    color: "purple",
                    polygon: 4
                },

                {
                    time: 3000,
                    color: "blue",
                    polygon: 2
                },

                {
                    time: 1000,
                    color: "blue",
                    polygon: 3
                }
          ]
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


var socket = io({"transports": ["websocket"]});

socket.emit("new_game", game.polygons);

var gUM = Modernizr.prefixed("getUserMedia", navigator);
var video = document.getElementById("live");
var canvas = document.getElementById("process");
var ctx = canvas.getContext("2d");

gUM({video: true}, function(localMediaStream) {
        video.src = window.URL.createObjectURL(localMediaStream);
    }, function(no) {});

setInterval(function() {
        ctx.drawImage(video, 0, 0, 320, 240);
        var data = canvas.toDataURL('image/jpeg', 1.0);
        socket.emit("frame", dataURItoBlob(data));
    }, 230);

socket.on("sound", function(hit) {
    var timecode = new Date().getTime();
    var soundID = hit.soundID;
    var color = hit.color;

    switch (soundID) {
        case 0:
            var sound = new Audio('sounds/hihat-acoustic01.mp3');
            break;
        case 1:
            var sound = new Audio('sounds/tom-acoustic02.mp3');
            break;
        case 2:
            var sound = new Audio('sounds/kick-acoustic02.mp3');
            break;
        case 3:
            var sound = new Audio('sounds/snare-acoustic02.mp3');
            break;
        case 4:
            var sound = new Audio('sounds/cowbell-808.mp3');
            break;

    }
    sound.play();

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

$('.btn').click(function(e) {
    e.preventDefault();
    $(this).addClass('active');
    $(this).siblings().removeClass('active');
})
