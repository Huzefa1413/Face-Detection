import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import { Container, Button, Card, Form, ListGroup } from 'react-bootstrap';
import Navbar from './Navbar'; // Assuming you have a Navbar component

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [classStartDate, setClassStartDate] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const classesCollection = query(
          collection(db, 'classes'),
          orderBy('createdOn', 'desc')
        );
        const classDocs = await getDocs(classesCollection);
        setClasses(
          classDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (
      newClassName.trim() === '' ||
      classStartDate.trim() === '' ||
      teacherName.trim() === ''
    ) {
      alert('Class name, start date or teachers name cannot be empty');
      return;
    }
    try {
      setLoading(true);
      const newClass = {
        name: newClassName,
        startDate: new Date(classStartDate),
        teacherName: teacherName,
        createdOn: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'classes'), newClass);
      setClasses([...classes, { id: docRef.id, ...newClass }]);
      setNewClassName('');
      setClassStartDate('');
      setTeacherName('');
      setShowAddClassForm(false);
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  return (
    <>
      <Navbar />
      <Container className="my-5">
        <h2 className="mb-4">Classes</h2>
        {loading ? (
          <Loader />
        ) : (
          <>
            {classes.length > 0 ? (
              <div className="row mb-4">
                {classes.map((cls) => (
                  <div className="col-md-4 mb-3" key={cls.id}>
                    <Card className="h-100">
                      <Card.Body>
                        <Card.Title className="text-center">
                          {cls.name}
                        </Card.Title>
                        <Card.Text>
                          <strong>Teacher's Name:</strong> {cls.teacherName}
                        </Card.Text>
                        <Card.Text>
                          <strong>Starting Date:</strong>{' '}
                          {cls.startDate.toDate().toLocaleDateString()}
                        </Card.Text>
                        <Button
                          variant="primary"
                          onClick={() => handleClassClick(cls.id)}
                        >
                          View Class
                        </Button>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                No classes available. Add a new class to get started.
              </p>
            )}
            <Button
              variant="success"
              className="mb-3"
              onClick={() => setShowAddClassForm(true)}
            >
              Add Class
            </Button>
            {showAddClassForm && (
              <Card className="p-4">
                <Form onSubmit={handleAddClass}>
                  <Form.Group controlId="newClassName">
                    <Form.Label>Class Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name"
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="teacherName" className="mt-3">
                    <Form.Label>Teacher's Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={newClassName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Enter teacher's name"
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="classStartDate" className="mt-3">
                    <Form.Label>Class Starting Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={classStartDate}
                      onChange={(e) => setClassStartDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="mt-3">
                    Save Class
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3 ms-2"
                    onClick={() => setShowAddClassForm(false)}
                  >
                    Cancel
                  </Button>
                </Form>
              </Card>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default Dashboard;
