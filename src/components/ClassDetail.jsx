import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import AddStudentModal from './AddStudentModal';
import MarkAttendanceModal from './MarkAttendanceModal';
import { Button } from 'react-bootstrap';

const ClassDetail = () => {
  const { classId } = useParams();
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);

  useEffect(() => {
    const fetchClassData = async () => {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        setClassName(classDoc.data().name);
      }
    };

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

    fetchClassData();
    fetchStudents();
  }, [classId]);

  const handleAttendanceMarked = () => {
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
  };

  const handleShowAddStudentModal = () => setShowAddStudentModal(true);
  const handleCloseAddStudentModal = () => setShowAddStudentModal(false);

  const handleShowMarkAttendanceModal = () => setShowMarkAttendanceModal(true);
  const handleCloseMarkAttendanceModal = () =>
    setShowMarkAttendanceModal(false);

  const handleStudentAdded = (newStudent) => {
    setStudents([...students, newStudent]);
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center">{className}</h1>
      <div className="d-flex gap-5">
        <h3>Students</h3>
        <Button onClick={handleShowMarkAttendanceModal} className="mb-3">
          Start Attendance
        </Button>
        <MarkAttendanceModal
          show={showMarkAttendanceModal}
          handleClose={handleCloseMarkAttendanceModal}
          students={students}
          onAttendanceMarked={handleAttendanceMarked}
        />
      </div>

      {students.length > 0 ? (
        <ul className="list-group mb-4">
          {students.map((student) => (
            <li
              key={student.id}
              className={`list-group-item d-flex justify-content-between align-items-center ${
                student.attendance ? 'bg-success text-white' : ''
              }`}
            >
              <div>
                <strong>{student.name}</strong> ({student.email})
              </div>
              {student.imageUrl && (
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  className="rounded-circle"
                  style={{ width: '50px', height: '50px' }}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No students in this class. Add a new student to get started.</p>
      )}
      <Button onClick={handleShowAddStudentModal} className="mb-4">
        Add Student
      </Button>
      <AddStudentModal
        show={showAddStudentModal}
        handleClose={handleCloseAddStudentModal}
        classId={classId}
        onStudentAdded={handleStudentAdded}
      />
    </div>
  );
};

export default ClassDetail;
