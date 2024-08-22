import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { updateDoc, doc } from 'firebase/firestore';
import { Modal, Button } from 'react-bootstrap';
import { db } from '../../firebase';
import { URL } from '../../config';
import Loader from './Loader';

const MarkAttendanceModal = ({
  show,
  handleClose,
  students,
  onAttendanceMarked,
}) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (cameraOpen && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((error) => console.error('Error accessing camera:', error));
    }
  }, [cameraOpen]);

  const handleStartAttendance = () => {
    setCameraOpen(!cameraOpen);
  };

  const handleMarkAttendance = async () => {
    if (videoRef.current && canvasRef.current) {
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

      try {
        setLoading(true);
        const blob = await fetch(imageUrl).then((res) => res.blob());
        const formData = new FormData();
        formData.append('image', blob, 'image.png');

        const response = await axios.post(`${URL}/recognize_face`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const recognizedStudent = response.data;
        console.log('Student', recognizedStudent);
        const student = students.find(
          (student) => student.id === recognizedStudent.id
        );
        if (recognizedStudent && student) {
          const currentDate = new Date();
          const timestamp = currentDate.toISOString();

          if (student.attendance) {
            // Check if attendance is already marked for today
            const alreadyMarked = student.attendance.some(
              (record) =>
                record.date === currentDate.toISOString().split('T')[0]
            );
            if (alreadyMarked) {
              setAttendanceResult(
                `Attendance already marked for ${student.name} today`
              );
            } else {
              // Update the Firestore document with new attendance record
              await updateDoc(doc(db, 'students', recognizedStudent.id), {
                attendance: [
                  ...student.attendance,
                  {
                    date: currentDate.toISOString().split('T')[0],
                    time: timestamp,
                  },
                ],
              });
              setAttendanceResult(
                `Attendance marked successfully for ${student.name}`
              );
              onAttendanceMarked();
            }
          } else {
            // If no attendance records exist, initialize the array
            await updateDoc(doc(db, 'students', recognizedStudent.id), {
              attendance: [
                {
                  date: currentDate.toISOString().split('T')[0],
                  time: timestamp,
                },
              ],
            });
            setAttendanceResult(
              `Attendance marked successfully for ${student.name}`
            );
            onAttendanceMarked();
          }
          setLoading(false);
        } else {
          setAttendanceResult('You do not belong to this class');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error recognizing face:', error);
        setAttendanceResult(error?.response?.data?.error);
        setLoading(false);
      }
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  const handleModalClose = () => {
    handleCloseCamera();
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose}>
      <Modal.Header closeButton>
        <Modal.Title>Mark Attendance</Modal.Title>
      </Modal.Header>
      {loading ? (
        <Loader />
      ) : (
        <Modal.Body>
          <Button onClick={handleStartAttendance} className="mb-3">
            {cameraOpen ? 'Close Camera' : 'Start Attendance'}
          </Button>
          {cameraOpen && (
            <>
              <Button onClick={handleMarkAttendance} className="mb-3">
                Mark Attendance
              </Button>
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
            </>
          )}
          {!cameraOpen && attendanceResult && <p>{attendanceResult}</p>}
        </Modal.Body>
      )}

      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MarkAttendanceModal;
