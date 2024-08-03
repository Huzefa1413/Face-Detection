import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Ensure you have react-router-dom installed and set up

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
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
      }
    };
    fetchClasses();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (newClassName.trim() === '') {
      alert('Class name cannot be empty');
      return;
    }
    try {
      const newClass = {
        name: newClassName,
        createdOn: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'classes'), newClass);
      setClasses([...classes, { id: docRef.id, ...newClass }]);
      setNewClassName('');
      setShowAddClassForm(false);
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  const handleClassClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {classes.length > 0 ? (
        <ul>
          {classes.map((cls) => (
            <li key={cls.id}>
              {cls.name}
              <button onClick={() => handleClassClick(cls.id)}>
                View Class
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No classes available. Add a new class to get started.</p>
      )}
      <button onClick={() => setShowAddClassForm(true)}>Add Class</button>
      {showAddClassForm && (
        <form onSubmit={handleAddClass}>
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Class Name"
            required
          />
          <button type="submit">Save Class</button>
          <button type="button" onClick={() => setShowAddClassForm(false)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default Dashboard;
