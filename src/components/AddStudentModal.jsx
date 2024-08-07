import React, { useState, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import axios from 'axios';

const AddStudentModal = ({ show, handleClose, classId, onStudentAdded }) => {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleCaptureImage = () => {
    if (cameraOpen) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL();
      setCapturedImage(imageUrl);
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setCameraOpen(false);
      detectFace(imageUrl);
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraOpen(true);
        })
        .catch((error) => console.error('Error accessing camera:', error));
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraOpen(false);
    }
  };

  const detectFace = async (imageDataUrl) => {
    try {
      const blob = await fetch(imageDataUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const response = await axios.post(
        'http://127.0.0.1:5000/detect_face',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.length > 0) {
        setFaceDetected(true);
      } else {
        alert('No face detected. Please try again.');
        setFaceDetected(false);
      }
    } catch (error) {
      console.error('Error detecting face:', error);
      setFaceDetected(false);
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (
      studentName.trim() === '' ||
      studentEmail.trim() === '' ||
      !capturedImage
    ) {
      alert('Student details and image are required');
      return;
    }
    try {
      const imageRef = ref(storage, `images/${Date.now()}.png`);
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      const newStudent = {
        name: studentName,
        email: studentEmail,
        classId,
        createdOn: new Date(),
        imageUrl,
      };
      await addDoc(collection(db, 'students'), newStudent);
      onStudentAdded(newStudent);

      // Notify backend to retrain the model with the new student
      await axios.post('http://127.0.0.1:5000/retrain_model', {
        classId,
      });

      setStudentName('');
      setStudentEmail('');
      setCapturedImage(null);
      setFaceDetected(false);
      alert('Student added and model updated successfully');
      handleClose();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Student</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSaveStudent}>
          <Form.Group className="mb-3">
            <Form.Label>Student Name</Form.Label>
            <Form.Control
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Student Email</Form.Label>
            <Form.Control
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Enter student email"
              required
            />
          </Form.Group>
          <Button
            variant="primary"
            onClick={handleCaptureImage}
            className="mb-3"
          >
            {cameraOpen ? 'Capture Image' : 'Open Camera'}
          </Button>
          {cameraOpen && (
            <Button
              variant="danger"
              onClick={handleCloseCamera}
              className="mb-3 ms-2"
            >
              Close Camera
            </Button>
          )}
          {!cameraOpen && capturedImage && (
            <div className="mt-3">
              <img
                src={capturedImage}
                alt="Captured"
                className="img-thumbnail"
                style={{ width: '150px', height: '150px' }}
              />
            </div>
          )}
          {!cameraOpen && faceDetected && (
            <Button type="submit" variant="success" className="mt-2">
              Save Student
            </Button>
          )}
        </Form>
        <video
          ref={videoRef}
          style={{
            display: cameraOpen ? 'block' : 'none',
            width: '100%',
            maxWidth: '400px',
          }}
          className="mb-4"
        ></video>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </Modal.Body>
    </Modal>
  );
};

export default AddStudentModal;
