import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import axios from 'axios';

const ClassDetail = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsCollection = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const studentDocs = await getDocs(studentsCollection);
      setStudents(
        studentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchStudents();
  }, [classId]);

  const handleCaptureImage = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch((error) => console.error('Error accessing camera:', error));

    videoRef.current.addEventListener('loadeddata', () => {
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

      detectFace(imageUrl);
    });
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
      setStudents([...students, newStudent]);
      setStudentName('');
      setStudentEmail('');
      setCapturedImage(null);
      setFaceDetected(false);
      alert('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleStartAttendance = () => {
    setMarkingAttendance(true);
    setAttendanceResult(null);
  };

  const handleMarkAttendance = async () => {
    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const response = await axios.post(
        'http://127.0.0.1:5000/recognize_face',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const recognizedStudent = response.data;
      const studentExists = students.some(
        (student) => student.id === recognizedStudent.id
      );
      if (recognizedStudent && studentExists) {
        await updateDoc(doc(db, 'students', recognizedStudent.id), {
          attendance: new Date(),
        });
        setAttendanceResult('Attendance marked successfully');
      } else {
        setAttendanceResult('You do not belong to this class');
      }
    } catch (error) {
      console.error('Error recognizing face:', error);
      setAttendanceResult('Error recognizing face');
    }
  };

  return (
    <div>
      <h2>Class Detail</h2>
      <h3>Students</h3>
      {students.length > 0 ? (
        <ul>
          {students.map((student) => (
            <li key={student.id}>
              {student.name} ({student.email})
              {student.imageUrl && (
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No students in this class. Add a new student to get started.</p>
      )}
      <h3>Add Student</h3>
      <form onSubmit={handleSaveStudent}>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Student Name"
          required
        />
        <input
          type="email"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          placeholder="Student Email"
          required
        />
        <button type="button" onClick={handleCaptureImage}>
          Capture Image
        </button>
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            style={{ width: '100px', height: '100px' }}
          />
        )}
        {faceDetected && <button type="submit">Save Student</button>}
      </form>
      <video ref={videoRef} style={{ display: 'none' }}></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      <h3>Mark Attendance</h3>
      <button onClick={handleStartAttendance}>Start Attendance</button>
      {markingAttendance && (
        <div>
          <button onClick={handleCaptureImage}>Capture Image</button>
          {capturedImage && (
            <div>
              <img
                src={capturedImage}
                alt="Captured"
                style={{ width: '100px', height: '100px' }}
              />
              <button onClick={handleMarkAttendance}>Mark Attendance</button>
            </div>
          )}
        </div>
      )}
      {attendanceResult && <p>{attendanceResult}</p>}
    </div>
  );
};

export default ClassDetail;
