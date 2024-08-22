import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import AddStudentModal from './AddStudentModal';
import MarkAttendanceModal from './MarkAttendanceModal';
import { Button, Card, Row, Col } from 'react-bootstrap';
import Loader from './Loader';
import Navbar from './Navbar';
import logo from '../assets/smitlogo.png'; // Update this path to your logo image

const ClassDetail = () => {
  const { classId } = useParams();
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClassData = async () => {
      setLoading(true);
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        setClassName(classDoc.data().name);
      }
      setLoading(false);
    };

    const fetchStudents = async () => {
      setLoading(true);
      const studentsCollection = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const studentDocs = await getDocs(studentsCollection);
      setStudents(
        studentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    };

    fetchClassData();
    fetchStudents();
  }, [classId]);

  const handleAttendanceMarked = () => {
    const fetchStudents = async () => {
      setLoading(true);
      const studentsCollection = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const studentDocs = await getDocs(studentsCollection);
      setStudents(
        studentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
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
    <>
      <Navbar />

      <div className="container mt-4">
        {loading ? (
          <Loader />
        ) : (
          <>
            <h1 className="text-center mb-5">{className}</h1>
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
              <h3>Students</h3>
              <div>
                <Button
                  onClick={handleShowMarkAttendanceModal}
                  className="me-2 mt-2"
                >
                  Start Attendance
                </Button>
                <Link to={`/viewattendance/${classId}`}>
                  <Button className="mt-2">View Attendance</Button>
                </Link>
                <MarkAttendanceModal
                  show={showMarkAttendanceModal}
                  handleClose={handleCloseMarkAttendanceModal}
                  students={students}
                  onAttendanceMarked={handleAttendanceMarked}
                />
              </div>
            </div>

            <Row>
              {students.length > 0 ? (
                students.map((student) => (
                  <Col
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={student.id}
                    className="mb-3"
                  >
                    <Card className="text-center student-card">
                      <Card.Body>
                        <img
                          src={logo}
                          alt="Logo"
                          className="mb-3"
                          style={{ width: '110px' }}
                        />
                        <Card.Title className="mb-1">
                          SAYLANI MASS IT <br /> TRAINING PROGRAM
                        </Card.Title>
                        {student.imageUrl && (
                          <img
                            src={student.imageUrl}
                            alt={student.name}
                            className="pic"
                          />
                        )}
                        <Card.Text className="name">{student.name}</Card.Text>
                        <Card.Text className="classname">{className}</Card.Text>
                        <Card.Text className="rollNo">
                          {student.rollNo}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col xs={12}>
                  <p>
                    No students in this class. Add a new student to get started.
                  </p>
                </Col>
              )}
            </Row>

            <Button onClick={handleShowAddStudentModal} className="mb-4">
              Add Student
            </Button>
            <AddStudentModal
              show={showAddStudentModal}
              handleClose={handleCloseAddStudentModal}
              classId={classId}
              onStudentAdded={handleStudentAdded}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ClassDetail;
