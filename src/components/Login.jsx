import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import Navbar from './Navbar';
import { Container, Card, Form, Button } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      alert('Error logging in: Incorrect credentials');
    }
  };

  return (
    <>
      <Navbar />
      <Container className="d-flex v-100 align-items-center justify-content-center">
        <Card className="p-4 m-5 login">
          <Card.Title className="text-center">Login</Card.Title>
          <Form onSubmit={handleLogin}>
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Form.Group>
            <Button type="submit" className="btn btn-primary btn-block mt-3">
              Login
            </Button>
          </Form>
          <div className="mt-4 text-center">
            <p className="text-muted">Use the following credentials:</p>
            <p>
              <strong>Email:</strong> admin@saylani.com
            </p>
            <p>
              <strong>Password:</strong> saylani_admin
            </p>
          </div>
        </Card>
      </Container>
    </>
  );
};

export default Login;
