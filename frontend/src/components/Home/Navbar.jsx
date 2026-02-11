import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LogOut, Search } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { fetchVideos } from '../../redux/slices/videoSlice';

const Navbar = ({ user, isAuthenticated }) => {
    const dispatch = useDispatch();

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            dispatch(fetchVideos({ search: e.target.value }));
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar__logo">NETFLIX-ISH</div>

            <div className="navbar__actions">
                <div className="navbar__search-wrapper">
                    <Search size={20} className="navbar__search-icon" />
                    <input
                        type="text"
                        placeholder="Titles, people, genres"
                        onKeyDown={handleSearch}
                        className="navbar__search-input"
                    />
                </div>
                {isAuthenticated ? (
                    <div className="navbar__user">
                        <span className="navbar__username">{user?.full_name}</span>
                        <button
                            onClick={() => dispatch(logout())}
                            className="navbar__logout-btn"
                            aria-label="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="btn-primary navbar__signin-link">
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
