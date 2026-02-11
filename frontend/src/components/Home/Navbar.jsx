import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ChevronDown, LogOut, Search } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { fetchVideos } from '../../redux/slices/videoSlice';

const Navbar = ({ user, isAuthenticated }) => {
    const dispatch = useDispatch();
    const [showLogoutMenu, setShowLogoutMenu] = useState(false);
    const menuRef = useRef(null);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            dispatch(fetchVideos({ search: e.target.value }));
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowLogoutMenu(false);
            }
        };
        if (showLogoutMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showLogoutMenu]);

    const handleLogout = () => {
        setShowLogoutMenu(false);
        dispatch(logout());
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
                    <div className="navbar__user" ref={menuRef}>
                        <span className="navbar__username">{user?.full_name}</span>
                        <button
                            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                            className="navbar__logout-btn"
                            aria-label="Account menu"
                        >
                            <ChevronDown size={20} />
                        </button>
                        {showLogoutMenu && (
                            <div className="navbar__dropdown">
                                <button
                                    onClick={handleLogout}
                                    className="navbar__dropdown-logout"
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        )}
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
