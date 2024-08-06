from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore, storage
import pickle

app = Flask(__name__)
CORS(app)

# Initialize Firebase
cred = credentials.Certificate("face-detection-102af-firebase-adminsdk-pal10-1711c61527.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'face-detection-102af.appspot.com'})

db = firestore.client()
bucket = storage.bucket()

# Load model
with open('face_recognizer.pkl', 'rb') as f:
    data = pickle.load(f)
face_recognizer = data['model']
label_encoder = data['label_encoder']

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@app.route('/detect_face', methods=['POST'])
def detect_face():
    file = request.files['image']
    npimg = np.fromfile(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_GRAYSCALE)
    faces = face_cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    response = []
    for (x, y, w, h) in faces:
        response.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h)
        })
    return jsonify(response)
    
@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    file = request.files['image']
    npimg = np.fromfile(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_GRAYSCALE)
    faces = face_cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        return jsonify({"error": "No face detected"}),400
    
    results = []
    for (x, y, w, h) in faces:
        face = img[y:y+h, x:x+w]
        face = cv2.resize(face, (100, 100)).flatten().reshape(1, -1)
        label = face_recognizer.predict(face)[0]
        decision_function = face_recognizer.decision_function(face)
        confidence = decision_function[0] if decision_function.size == 1 else decision_function[0][0]
        
        results.append({
            "label": int(label),
            "confidence": float(confidence)
        })
    
    if len(results) > 0:
        # Assume the first result is the most relevant
        label = results[0]['label']
        confidence = results[0]['confidence']
        recognized_student = {
            "id": label_encoder.inverse_transform([label])[0],
            "confidence": confidence
        }
        return jsonify(recognized_student)
    return jsonify({"error": "Face not recognized"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
