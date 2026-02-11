import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, resetError } from '../redux/slices/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Styles
import '../styles/Watch.css'; // Shared auth error styles

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

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
            dispatch(resetError());
        }
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!email || !password) return;
        dispatch(login({ email, password }));
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-box">
                <form onSubmit={submitHandler}>
                    <h1 className="auth-title">Sign In</h1>

                    {error && (
                        <div className="auth-error-box">
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

                    <div className="auth-or-divider">OR</div>

                    <div className="social-login">
                        <a href={`${API_BASE_URL}/api/auth/google`} className="btn-social">Continue with Google</a>
                        <a href={`${API_BASE_URL}/api/auth/github`} className="btn-social">Continue with GitHub</a>
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