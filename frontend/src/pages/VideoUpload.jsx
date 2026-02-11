import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Styles
import '../styles/Watch.css'; // Shared styles including upload-page classes

const VideoUpload = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadedVideoId, setUploadedVideoId] = useState(null);
    const [processingStatus, setProcessingStatus] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
            if (!validTypes.includes(selectedFile.type)) {
                alert('Please select a valid video file (MP4, MOV, AVI, MKV, WEBM)');
                return;
            }
            if (selectedFile.size > 500 * 1024 * 1024) {
                alert('File size must be less than 500MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            alert('Please select a video file');
            return;
        }

        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        setUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description);

        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
        tagArray.forEach(tag => {
            formData.append('tags[]', tag);
        });

        try {
            const response = await axios.post(`${API_BASE_URL}/api/upload/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setUploadStatus('success');
            setUploadedVideoId(response.data.videoId);
            pollProcessingStatus(response.data.videoId);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            setUploading(false);
        }
    };

    const pollProcessingStatus = async (videoId) => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/upload/status/${videoId}`, {
                    withCredentials: true
                });

                setProcessingStatus(response.data.processing_status);

                if (response.data.processing_status === 'completed') {
                    clearInterval(interval);
                    setUploading(false);
                    setTimeout(() => {
                        navigate(`/watch/${videoId}`);
                    }, 2000);
                } else if (response.data.processing_status === 'failed') {
                    clearInterval(interval);
                    setUploading(false);
                    setUploadStatus('error');
                }
            } catch (error) {
                console.error('Status check error:', error);
                clearInterval(interval);
                setUploading(false);
            }
        }, 3000);
    };

    const resetForm = () => {
        setUploadStatus(null);
        setFile(null);
        setTitle('');
        setDescription('');
        setTags('');
    };

    return (
        <div className="upload-page">
            <div className="upload-page__container">
                <div className="upload-page__header">
                    <Video size={40} color="#e50914" />
                    <h1 className="upload-page__title">Upload Video</h1>
                </div>

                {!uploading && !uploadStatus && (
                    <form onSubmit={handleSubmit}>
                        {/* File Input */}
                        <div className="upload-page__field">
                            <label className="upload-page__label">Video File *</label>
                            <div
                                className={`upload-page__dropzone ${file ? 'upload-page__dropzone--active' : ''}`}
                                onClick={() => document.getElementById('fileInput').click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile) {
                                        handleFileChange({ target: { files: [droppedFile] } });
                                    }
                                }}
                            >
                                <Upload size={48} color={file ? '#e50914' : '#666'} style={{ marginBottom: '16px' }} />
                                <p className={`upload-page__dropzone-text ${file ? 'upload-page__dropzone-text--active' : 'upload-page__dropzone-text--inactive'}`}>
                                    {file ? file.name : 'Click to upload or drag and drop'}
                                </p>
                                <p className="upload-page__dropzone-subtext">
                                    MP4, MOV, AVI, MKV, WEBM (Max 500MB)
                                </p>
                            </div>
                            <input
                                id="fileInput"
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Title */}
                        <div className="upload-page__field">
                            <label className="upload-page__label">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter video title"
                                className="upload-page__input"
                            />
                        </div>

                        {/* Description */}
                        <div className="upload-page__field">
                            <label className="upload-page__label">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter video description"
                                rows={4}
                                className="upload-page__textarea"
                            />
                        </div>

                        {/* Tags */}
                        <div className="upload-page__field upload-page__field--last">
                            <label className="upload-page__label">Tags</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Enter tags separated by commas (e.g., Sports, Action, Tutorial)"
                                className="upload-page__input"
                            />
                        </div>

                        {/* Submit */}
                        <button type="submit" className="upload-page__submit-btn">
                            Upload Video
                        </button>
                    </form>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <div className="upload-page__status">
                        <Loader size={64} color="#e50914" className="spinner--loader" style={{ marginBottom: '24px' }} />
                        <h2 className="upload-page__status-title">
                            {processingStatus === 'processing' ? 'Transcoding Video...' : 'Uploading...'}
                        </h2>
                        <p className="upload-page__status-text">
                            {processingStatus === 'processing'
                                ? 'Generating multiple quality levels (144p, 360p, 480p, 720p, 1080p). This may take several minutes...'
                                : 'Please wait while we process your video'}
                        </p>
                        {processingStatus === 'processing' && (
                            <div className="upload-page__processing-info">
                                <p>⚙️ FFmpeg is creating HLS adaptive bitrate streams...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Success */}
                {uploadStatus === 'success' && processingStatus === 'completed' && (
                    <div className="upload-page__status">
                        <CheckCircle size={64} color="#4CAF50" style={{ marginBottom: '24px' }} />
                        <h2 className="upload-page__status-title">Upload Successful!</h2>
                        <p className="upload-page__status-text" style={{ marginBottom: '24px' }}>
                            Your video has been transcoded and is ready to watch.
                        </p>
                        <button
                            onClick={() => navigate(`/watch/${uploadedVideoId}`)}
                            className="upload-page__action-btn upload-page__action-btn--success"
                        >
                            Watch Now
                        </button>
                    </div>
                )}

                {/* Error */}
                {uploadStatus === 'error' && (
                    <div className="upload-page__status">
                        <XCircle size={64} color="#f44336" style={{ marginBottom: '24px' }} />
                        <h2 className="upload-page__status-title">Upload Failed</h2>
                        <p className="upload-page__status-text" style={{ marginBottom: '24px' }}>
                            There was an error uploading your video. Please try again.
                        </p>
                        <button
                            onClick={resetForm}
                            className="upload-page__action-btn upload-page__action-btn--error"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUpload;
