import flask
import flask_socketio
import numpy as np

import cv2

from colorTrack import theBig

app = flask.Flask(__name__, template_folder='frontend/', static_url_path='')
socketio = flask_socketio.SocketIO(app)
currPolygons = []

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

@app.route('/frontend/vex/<path:path>')
def serve_vex(path):
    return flask.send_from_directory('frontend/vex', path)

i = 0
@socketio.on('frame')
def handle_frame(frame_data):
    global i
    decoded = np.asarray(bytearray(frame_data), dtype='uint8')
    img = cv2.imdecode(decoded, flags=cv2.CV_LOAD_IMAGE_COLOR)
    img = cv2.flip(img, 1)
    i +=1
    frame, res, hit, hit2 = theBig(img, 0, True, currPolygons)
    if hit != None:
        print hit
        import random
        cv2.imwrite(str(random.random()) + ".jpg", img)
        payload = {"soundID" : hit, "color" : "blue"}
        flask_socketio.emit('sound', payload)
    if hit2 != None:
        print "pink" + str(hit2)
        payload = {"soundID" : hit2, "color" : "purple"}
        flask_socketio.emit('sound', payload)



@socketio.on('new_game')
def handle_new_game(polygons):
    # TODO: Handle the polygons
    global currPolygons
    currPolygons = polygons

if __name__ == '__main__':
    socketio.run(app, debug=True)
