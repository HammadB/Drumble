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
        

var socket = io({"transports": ["websocket"]});

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

socket.on("sound", function(soundID) {
    switch (soundID) {
        case 0:
            console.log('fak');
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