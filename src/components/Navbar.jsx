import React from 'react';
import { getAuth, signOut } from 'firebase/auth'; // Import signOut from Firebase Auth
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import logo from '../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleLogout = async () => {
    const auth = getAuth(); // Get the Firebase Auth instance
    try {
      await signOut(auth); // Sign out the user
      navigate('/'); // Redirect to the login page after logout
    } catch (error) {
      console.error('Error signing out: ', error); // Handle errors
    }
  };

  return (
    <div className="mynavbar">
      <img src={logo} alt="logo" />
      <button onClick={handleLogout} className="btn btn-danger">
        Logout
      </button>
    </div>
  );
};

export default Navbar;
