import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load pre-trained face detection model from OpenCV
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Simulate a stored faces database
# In a real application, this would be stored in a database
stored_faces = {
    "student1_id": {
        "classId": "class1_id",
        "descriptor": [0.1, 0.2, 0.3]  # Dummy descriptor
    },
    # Add more student entries as needed
}

@app.route('/detect_face', methods=['POST'])
def detect_face():
    file = request.files['image']
    npimg = np.fromfile(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    response = []
    for (x, y, w, h) in faces:
        face_img = img[y:y+h, x:x+w]  # Crop the face
        _, buffer = cv2.imencode('.jpg', face_img)
        face_img_encoded = buffer.tobytes()
        response.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "face_image": face_img_encoded.hex()  # Convert to hex string for transmission
        })
    return jsonify(response)

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    file = request.files['image']
    npimg = np.fromfile(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        return jsonify({"error": "No face detected"}), 400

    # For simplicity, we'll assume only one face per image
    (x, y, w, h) = faces[0]
    face_img = img[y:y+h, x:x+w]

    # Simulate extracting a face descriptor
    # In a real application, use a proper face recognition model like FaceNet or Dlib
    face_descriptor = [0.1, 0.2, 0.3]  # Dummy descriptor

    # Find the best match
    best_match = None
    best_distance = float('inf')
    for student_id, student_data in stored_faces.items():
        stored_descriptor = student_data["descriptor"]
        distance = np.linalg.norm(np.array(stored_descriptor) - np.array(face_descriptor))
        if distance < best_distance:
            best_distance = distance
            best_match = {"id": student_id, "classId": student_data["classId"]}

    if best_distance < 0.6:  # Threshold for a match
        return jsonify(best_match)
    else:
        return jsonify({"error": "No matching student found"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
