import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, resetError } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Grab the state
    const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    // --- DEBUG LOGGING ---
    console.log("🎨 Login Component Rendered. Current Error State:", error);

    useEffect(() => {
        if (isAuthenticated || user) {
            navigate('/');
        }
    }, [user, isAuthenticated, navigate]);

    useEffect(() => {
        dispatch(resetError());
    }, []);

    const handleChange = (e, setter) => {
        setter(e.target.value);
        if (error) {
            console.log("⌨️ User typing, clearing error...");
            dispatch(resetError());
        }
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!email || !password) return;
        
        console.log("🚀 Submitting Login:", { email, password });
        dispatch(login({ email, password }));
    };

    return (
        <div className="auth-wrapper" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')" }}>
            <div className="auth-box">
                <form onSubmit={submitHandler}>
                    <h1 className="auth-title">Sign In</h1>

                    {/* ERROR BOX */}
                    {error && (
                        <div style={{ 
                            background: '#e87c03', 
                            color: 'white', 
                            padding: '10px 20px', 
                            borderRadius: '4px', 
                            marginBottom: '16px', 
                            fontSize: '14px',
                            fontWeight: '500',
                            textAlign: 'left',
                            border: '2px solid red' // Added red border to make it super obvious
                        }}>
                           {/* Displaying the actual error from Redux first */}
                           <strong>Error:</strong> {error}
                        </div>
                    )}

                    <div className="form-group">
                        <input 
                            className="form-input" 
                            type="email" 
                            placeholder="Email or phone number" 
                            value={email}
                            onChange={(e) => handleChange(e, setEmail)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <input 
                            className="form-input" 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => handleChange(e, setPassword)}
                            required 
                        />
                    </div>

                    <button className="btn-primary auth-btn" type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div style={{ color: '#b3b3b3', fontSize: '13px', textAlign: 'center', margin: '15px 0' }}>OR</div>

                    <div className="social-login">
                         <a href="http://localhost:5000/api/auth/google" className="btn-social">Google</a>
                         <a href="http://localhost:5000/api/auth/github" className="btn-social">GitHub</a>
                    </div>

                    <div className="auth-footer">
                        New to this platform? <Link to="/register" className="auth-link">Sign up now.</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;