import flask
import flask_socketio
import numpy as np

import cv2

from colorTrack import theBig

app = flask.Flask(__name__, template_folder='frontend/', static_url_path='')
socketio = flask_socketio.SocketIO(app)

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/sounds/<path:path>')
def sounds(path):
    return flask.send_from_directory('sounds', path)

@app.route('/index.js')
def serve_js():
    return flask.send_from_directory('frontend', 'index.js')

@app.route('/style.css')
def serve_style():
    return flask.send_from_directory('frontend', 'style.css')

i = 0
@socketio.on('frame')
def handle_frame(frame_data):
    global i
    decoded = np.asarray(bytearray(frame_data), dtype='uint8')
    img = cv2.imdecode(decoded, flags=cv2.CV_LOAD_IMAGE_COLOR)
    img = cv2.flip(img, 1)
    i +=1
    frame, res, hit = theBig(img, 0, True)
    if hit != None:
        print hit
        import random
        cv2.imwrite(str(random.random()) + ".jpg", img)
        flask_socketio.emit('sound', hit)

@socketio.on('new_game')
def handle_new_game(polygons):
    # TODO: Handle the polygons
    print polygons

if __name__ == '__main__':
    socketio.run(app, debug=True)
