import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register, resetError } from '../redux/slices/authSlice';
import { Link, useNavigate } from 'react-router-dom';

// Styles
import '../styles/Watch.css'; // Shared auth error styles

const Register = () => {
    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isAuthenticated || user) {
            navigate('/');
        }
    }, [user, isAuthenticated, navigate]);

    useEffect(() => {
        dispatch(resetError());
    }, []);

    const submitHandler = (e) => {
        e.preventDefault();
        setLocalError('');

        const full_name = nameRef.current.value;
        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        if (!email || !password || !full_name) {
            setLocalError('All fields are required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setLocalError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        dispatch(register({ full_name, email, password }));
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-box">
                <form onSubmit={submitHandler}>
                    <h1 className="auth-title">Sign Up</h1>

                    {localError && (
                        <div className="auth-error-box--simple">{localError}</div>
                    )}

                    {error && (
                        <div className="auth-error-box--simple">{error}</div>
                    )}

                    <div className="form-group">
                        <input className="form-input" type="text" placeholder="Full Name" ref={nameRef} required />
                    </div>
                    <div className="form-group">
                        <input className="form-input" type="email" placeholder="Email address" ref={emailRef} required />
                    </div>
                    <div className="form-group">
                        <input className="form-input" type="password" placeholder="Password" ref={passwordRef} required />
                    </div>

                    <button className="btn-primary auth-btn" type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login" className="auth-link">Sign in now.</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;