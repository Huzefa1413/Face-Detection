import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import Loader from './Loader';

const ViewAttendance = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    const fetchClassData = async () => {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        setClassName(classDoc.data().name);
        setStartDate(classDoc.data().startDate.toDate()); // Assuming startDate is a Firestore Timestamp
      }
    };

    const fetchStudents = async () => {
      const studentsCollection = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const studentDocs = await getDocs(studentsCollection);
      const studentList = studentDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(studentList);
      setLoading(false);
    };

    fetchClassData();
    fetchStudents();
  }, [classId]);

  // Generate a date range from start date to today
  const generateDateRange = () => {
    const dates = [];
    const currentDate = new Date();
    let date = new Date(startDate);

    while (date <= currentDate) {
      dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      date.setDate(date.getDate() + 1);
    }

    return dates;
  };

  const dateRange = generateDateRange();

  // Function to format time to 12-hour format without date
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleString('en-US', options);
  };

  return (
    <div className="container mt-4">
      {loading ? (
        <Loader />
      ) : (
        <>
          <h1 className="text-center">{className} Attendance</h1>
          {students.length > 0 ? (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  {dateRange.map((date) => (
                    <th key={date}>{date}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    {dateRange.map((date) => {
                      // Find attendance records for the current date
                      const attendanceRecord = student.attendance?.find(
                        (record) => record.date === date
                      );
                      return (
                        <td
                          key={date}
                          className={
                            attendanceRecord
                              ? 'bg-success text-white'
                              : 'bg-danger text-white'
                          }
                        >
                          {attendanceRecord ? (
                            <div>
                              ✔️
                              <br />
                              {formatTime(attendanceRecord.time)}
                            </div>
                          ) : (
                            <div>❌</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No students in this class.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ViewAttendance;
