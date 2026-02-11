import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import axios from 'axios'

// Set Axios defaults
axios.defaults.withCredentials = true;

// Global Axios error handler: redirect to error page on server crash (5xx)
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status >= 500) {
            // Avoid infinite redirect loop from /error itself
            if (!window.location.pathname.startsWith('/error')) {
                window.location.href = '/error';
            }
        }
        return Promise.reject(error);
    }
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>,
)
