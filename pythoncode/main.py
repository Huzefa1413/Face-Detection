import numpy as np
import cv2
import firebase_admin
from firebase_admin import credentials, firestore, storage
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
import io

app = Flask(__name__)
CORS(app)

# Initialize Firebase
cred = credentials.Certificate("face-detection-102af-firebase-adminsdk-pal10-1711c61527.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'face-detection-102af.appspot.com'})

db = firestore.client()
bucket = storage.bucket()

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Function to fetch student images
def fetch_student_images():
    students_ref = db.collection('students').stream()

    images = []
    labels = []
    for student in students_ref:
        student_data = student.to_dict()
        image_url = student_data.get('imageUrl')
        if image_url:
            image_name = image_url.split('/')[-1]
            image_name = image_name.split('?')[0]
            image_name = image_name.split('%2F')[-1]
            blob = bucket.blob(f'images/{image_name}')
            image_bytes = blob.download_as_bytes()
            img_array = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
            images.append(img)
            labels.append(student.id)
    return images, labels

# Function to train model
def train_model(images, labels):
    faces = []
    face_labels = []
    
    for img, label in zip(images, labels):
        detected_faces = face_cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        for (x, y, w, h) in detected_faces:
            face = img[y:y+h, x:x+w]
            faces.append(cv2.resize(face, (100, 100)).flatten())
            face_labels.append(label)
    
    if len(faces) == 0:
        raise ValueError("No faces found for training.")
    
    # Encode labels
    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(face_labels)
    
    # Train SVM
    recognizer = SVC(kernel='linear', probability=True)
    recognizer.fit(faces, encoded_labels)
    
    model_buffer = io.BytesIO()
    pickle.dump({'model': recognizer, 'label_encoder': label_encoder}, model_buffer)
    model_buffer.seek(0)

    # Upload the model to Firebase Storage
    blob = bucket.blob('models/face_recognizer.pkl')
    blob.upload_from_file(model_buffer, content_type='application/octet-stream')
    print("Model uploaded to Firebase Storage.")

# Load model directly from Firebase Storage
def load_model():
    global face_recognizer, label_encoder
    blob = bucket.blob('models/face_recognizer.pkl')
    model_bytes = blob.download_as_bytes()
    model_buffer = io.BytesIO(model_bytes)
    data = pickle.load(model_buffer)
    face_recognizer = data['model']
    label_encoder = data['label_encoder']
    print("Model loaded from Firebase Storage.")

# Endpoint to detect face
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
    
# Endpoint to recognize face
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

# Endpoint to retrain model
@app.route('/retrain_model', methods=['POST'])
def retrain_model():
    # class_id = request.json['classId']
    images, labels = fetch_student_images()
    if len(images) == 0:
        return jsonify({"error": "No images found"}), 400
    try:
        train_model(images, labels)
        return jsonify({"success": True})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    # Initial training of the model
    images, labels = fetch_student_images()
    train_model(images, labels)
    load_model()
    app.run(port=5000)