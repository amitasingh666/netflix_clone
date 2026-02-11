import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register, resetError } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Select auth state from Redux
    const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    // Local state for immediate client-side validation errors
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
        
        // 1. Clear previous errors
        setLocalError('');
        
        const full_name = nameRef.current.value;
        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        // 2. Check for empty fields
        if (!email || !password || !full_name) {
            setLocalError('All fields are required');
            return;
        }

        // 3. Validate Email Format (Regex)
        // Checks for: characters + @ + characters + . + characters
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setLocalError('Please enter a valid email address');
            return;
        }

        // 4. Validate Password Length (Optional but recommended)
        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        // 5. If all checks pass, dispatch register action
        dispatch(register({ full_name, email, password }));
    };

    return (
        <div className="auth-wrapper" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')" }}>
            <div className="auth-box">
                <form onSubmit={submitHandler}>
                    <h1 className="auth-title">Sign Up</h1>

                    {/* Display Local Validation Errors (Frontend) */}
                    {localError && (
                        <div style={{ background: '#e87c03', padding: '10px 20px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                            {localError}
                        </div>
                    )}

                    {/* Display Server Errors (Backend/Redux) */}
                    {error && (
                        <div style={{ background: '#e87c03', padding: '10px 20px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                            {error}
                        </div>
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