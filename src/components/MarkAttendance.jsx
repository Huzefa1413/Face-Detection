import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const MarkAttendance = ({ classId }) => {
  const videoRef = useRef(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const studentDocs = await getDocs(q);
      setStudents(
        studentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };

    fetchStudents();
  }, [classId]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error('Error accessing webcam', err));
    };

    loadModels().then(startVideo);
  }, []);

  const recognizeFaces = async () => {
    const labeledDescriptors = students.map(
      (student) =>
        new faceapi.LabeledFaceDescriptors(student.name, [
          new Float32Array(student.descriptor),
        ])
    );

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(detections, {
          width: 720,
          height: 560,
        });
        resizedDetections.forEach((detection) => {
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          if (bestMatch.label !== 'unknown') {
            console.log(`Recognized ${bestMatch.label}`);
            // Mark attendance for recognized student
          } else {
            console.log('Student not recognized');
          }
        });
      }
    }, 1000);
  };

  return (
    <div>
      <h2>Mark Attendance</h2>
      <div>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="720"
          height="560"
          onPlay={recognizeFaces}
        />
      </div>
    </div>
  );
};

export default MarkAttendance;
