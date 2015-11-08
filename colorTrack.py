import cv2
import numpy as np

#for sorting contours
def contour_area_key(contour):
    return cv2.contourArea(contour)

def extractRange(hsvFrame, lower, upper):
    mask = cv2.inRange(hsvFrame, lower, upper)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT,(5,5))
    morphed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    imgray = morphed.copy()

    ret, thresh = cv2.threshold(imgray, 127, 255,cv2.THRESH_BINARY)
    contours, hierarchy = cv2.findContours(thresh,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key = contour_area_key, reverse = True)
    countoursToDraw = contours[:3]

    return countoursToDraw, mask

def getDrumRegion(height, width, bottomPercent = .80, num=5):
    hzWidth = width / num
    regionStart = int(bottomPercent * height)
    return regionStart, [0 + i*hzWidth for i in range(num)]

def getDrumRegionPolygons(height, width, bottomPercent=.80, num=5):
    hzWidth = width / num
    yStart = int(bottomPercent * height)
    bottom = height - 1
    polygons = []
    for i in range(num):
        if i == 0:
            polygons.append([(hzWidth*i, 0), (hzWidth*(i+1), 0), (hzWidth*(i+1), (bottom- yStart)), (hzWidth*i, (bottom- yStart))]) 
        else:
            polygons.append([(hzWidth*i, yStart), (hzWidth*(i+1), yStart), (hzWidth*(i+1), bottom), (hzWidth*i, bottom)]) 
    return polygons

def cycleContours(curr, maxC = 3):
    if curr == maxC - 1:
        return 0
    return curr + 1

def isRectanglePastHzLine(corners, lineY):
    for corner in corners:
        if corner[1] > lineY:
            return True

def point_inside_polygon(x, y, poly):

    n = len(poly)
    inside =False

    p1x,p1y = poly[0]
    for i in range(n+1):
        p2x,p2y = poly[i % n]
        if y > min(p1y,p2y):
            if y <= max(p1y,p2y):
                if x <= max(p1x,p2x):
                    if p1y != p2y:
                        xinters = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x,p1y = p2x,p2y

    return inside

def theBig(frame, currCountour, drawBoundingBox, drumRegionPolygons=None):
    height, width, _ = frame.shape

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    lower_blue = np.array([110,100,100])
    upper_blue = np.array([130, 255, 255])

    hitPolyIndex = None
    pinkHitPolyIndex = None

    countours, mask = extractRange(hsv, lower_blue, upper_blue)
    if len(countours) >= 3:
        countours = [countours[currCountour]]

    res = cv2.bitwise_and(frame, frame, mask = mask)
    cv2.drawContours(frame, countours, -1, (0,255,0), 3)

    lower_pink = np.array([140,60,60])
    upper_pink = np.array([160, 200, 200])

    countoursPink, maskPink = extractRange(hsv, lower_pink, upper_pink)
    if len(countoursPink) >= 3:
        countoursPink = [countoursPink[currCountour]]
    cv2.drawContours(frame, countoursPink, -1, (255,0,255))

    if not drumRegionPolygons:
        drumRegionPolygons = getDrumRegionPolygons(height, width)
    for polygon in drumRegionPolygons:
        pts = np.int0(polygon)
        cv2.polylines(frame, [pts], True, (0, 150, 0))

    #blueCountours
    if drawBoundingBox and len(countours):
        cnt = countours[currCountour]
        rect = cv2.minAreaRect(cnt)

        pts = cv2.cv.BoxPoints(rect)
        pts = np.int0(pts)

        minNumPoints = None
        hitPoly = None
        for i, polygon in enumerate(drumRegionPolygons):
            numPoints = 0
            for point in pts:
                if point_inside_polygon(point[0], point[1], polygon):
                    numPoints += 1
            if not minNumPoints or numPoints > minNumPoints:
                hitPoly = polygon
                minNumPoints = numPoints
                hitPolyIndex = i
        if minNumPoints:
            polyPts = np.int0(hitPoly)
            cv2.polylines(frame, [polyPts], True, (0, 0, 255), 40)
        else:
            hitPolyIndex = None

        cv2.polylines(frame, [pts], True, (0, 0, 255))

    #pinkCountours
    if drawBoundingBox and len(countoursPink):
        cnt = countoursPink[currCountour]
        rect = cv2.minAreaRect(cnt)

        pts = cv2.cv.BoxPoints(rect)
        pts = np.int0(pts)

        minNumPoints = None
        hitPoly = None
        for i, polygon in enumerate(drumRegionPolygons):
            numPoints = 0
            for point in pts:
                if point_inside_polygon(point[0], point[1], polygon):
                    numPoints += 1
            if not minNumPoints or numPoints > minNumPoints:
                hitPoly = polygon
                minNumPoints = numPoints
                pinkHitPolyIndex = i
        if minNumPoints:
            polyPts = np.int0(hitPoly)
            cv2.polylines(frame, [polyPts], True, (255, 0, 255), 40)
        else:
            pinkHitPolyIndex = None
 
        cv2.polylines(frame, [pts], True, (0, 0, 255))

    return frame, res, hitPolyIndex, pinkHitPolyIndex



if __name__ == "__main__":
    cap = cv2.VideoCapture(0)

    currCountour = 0
    drawBoundingBox = False

    while(True):

        _, frame = cap.read()

        frame = cv2.flip(frame, 1)

        frame, res, hit, hit2 = theBig(frame, currCountour, drawBoundingBox)

        cv2.imshow('frame', frame)
        cv2.imshow('res', res)
        k = cv2.waitKey(1) & 0xFF
        if k == ord('q'):
            break
        if k == ord('c'):
            currCountour = cycleContours(currCountour)
        if k == ord('d'):
            drawBoundingBox = not drawBoundingBox

    cap.release()
    cv2.destroyAllWindows()