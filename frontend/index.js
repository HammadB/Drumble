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

var socket = io({"transports": ["websocket"]});

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
      minWidth: 640,
      minHeight: 480
    }
  }
};

gUM(videoConstraints, function(localMediaStream) {
    video.src = window.URL.createObjectURL(localMediaStream);
}, errorCallback);

setInterval(function() {
    ctx.drawImage(video, 0, 0, 320, 240);
    var data = canvas.toDataURL('image/jpeg', 1.0);
    socket.emit("frame", dataURItoBlob(data));
}, 230);

socket.on("sound", function(soundID) {
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
});

$('.btn').click(function(e) {
    e.preventDefault();
    $(this).addClass('active');
    $(this).siblings().removeClass('active');
})


////////////////////////////////////////

    var display = document.getElementById('display');
    var displayContext = display.getContext('2d');

    //intermediate canvas. never rendered. used for calculations
    var back = document.createElement('canvas');
    var backcontext = back.getContext('2d');

    var cw,ch;

    //setting it and intermediate canvas to same frame size
    cw = video.clientWidth;
    console.log(cw)
    ch = video.clientHeight;
    console.log(ch)
    console.log(video)
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
        //example
        drawRectangle([0,0], [0, 50], [50, 50], [50, 0], "red", displayContext, 2);
    }, 0);
}

/*
4 points of xy coordinates [x,y]
color (string)
stroke (int)
draws a rectangle onto canvas display
*/
function drawRectangle(point1, point2, point3, point4, color, ctx, stroke) {
    ctx.beginPath();
    ctx.lineWidth = stroke;
    ctx.strokeStyle = color;
    ctx.rect(point1[0], point1[1], Math.abs(point4[0]-point1[0]), Math.abs(point1[1] - point2[1])); 
    ctx.stroke();
}

