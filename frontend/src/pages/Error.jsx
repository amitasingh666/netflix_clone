import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                color: '#fff',
                textAlign: 'center',
                padding: '0 20px'
            }}
        >
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ maxWidth: '480px', marginBottom: '2rem', color: '#aaa' }}>
                An unexpected error occurred while communicating with the server.
                Please try again in a moment.
            </p>
            <button
                onClick={() => navigate('/')}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '1rem' }}
            >
                Back to Home
            </button>
        </div>
    );
};

export default ErrorPage;

