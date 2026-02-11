import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';

const VideoUpload = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
    const [uploadedVideoId, setUploadedVideoId] = useState(null);
    const [processingStatus, setProcessingStatus] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
            if (!validTypes.includes(selectedFile.type)) {
                alert('Please select a valid video file (MP4, MOV, AVI, MKV, WEBM)');
                return;
            }
            // Validate file size (500MB max)
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

        // Parse tags (comma-separated)
        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
        tagArray.forEach(tag => {
            formData.append('tags[]', tag);
        });

        try {
            const response = await axios.post('http://localhost:5000/api/upload/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            setUploadStatus('success');
            setUploadedVideoId(response.data.videoId);

            // Start polling for processing status
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
                const response = await axios.get(`http://localhost:5000/api/upload/status/${videoId}`, {
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
        }, 3000); // Check every 3 seconds
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '40px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <Video size={40} color="#e50914" />
                    <h1 style={{
                        color: 'white',
                        fontSize: '2rem',
                        margin: 0
                    }}>Upload Video</h1>
                </div>

                {!uploading && !uploadStatus && (
                    <form onSubmit={handleSubmit}>
                        {/* File Input */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                color: '#aaa',
                                marginBottom: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                Video File *
                            </label>
                            <div style={{
                                border: '2px dashed rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '40px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                background: file ? 'rgba(229, 9, 20, 0.1)' : 'transparent'
                            }}
                                onClick={() => document.getElementById('fileInput').click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile) {
                                        handleFileChange({ target: { files: [droppedFile] } });
                                    }
                                }}>
                                <Upload size={48} color={file ? '#e50914' : '#666'} style={{ marginBottom: '16px' }} />
                                <p style={{ color: file ? '#e50914' : '#999', margin: 0 }}>
                                    {file ? file.name : 'Click to upload or drag and drop'}
                                </p>
                                <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '8px' }}>
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

                        {/* Title Input */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                color: '#aaa',
                                marginBottom: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter video title"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Description Input */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                color: '#aaa',
                                marginBottom: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter video description"
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Tags Input */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                color: '#aaa',
                                marginBottom: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                Tags
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Enter tags separated by commas (e.g., Sports, Action, Tutorial)"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: '#e50914',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f40612'}
                            onMouseLeave={(e) => e.target.style.background = '#e50914'}
                        >
                            Upload Video
                        </button>
                    </form>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Loader size={64} color="#e50914" style={{ animation: 'spin 1s linear infinite', marginBottom: '24px' }} />
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>
                            {processingStatus === 'processing' ? 'Transcoding Video...' : 'Uploading...'}
                        </h2>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                            {processingStatus === 'processing'
                                ? 'Generating multiple quality levels (144p, 360p, 480p, 720p, 1080p). This may take several minutes...'
                                : 'Please wait while we process your video'}
                        </p>
                        {processingStatus === 'processing' && (
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                background: 'rgba(229, 9, 20, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(229, 9, 20, 0.3)'
                            }}>
                                <p style={{ color: '#e50914', margin: 0, fontSize: '0.85rem' }}>
                                    ⚙️ FFmpeg is creating HLS adaptive bitrate streams...
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Success Message */}
                {uploadStatus === 'success' && processingStatus === 'completed' && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <CheckCircle size={64} color="#4CAF50" style={{ marginBottom: '24px' }} />
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>Upload Successful!</h2>
                        <p style={{ color: '#aaa', marginBottom: '24px' }}>
                            Your video has been transcoded and is ready to watch.
                        </p>
                        <button
                            onClick={() => navigate(`/watch/${uploadedVideoId}`)}
                            style={{
                                padding: '12px 32px',
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Watch Now
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {uploadStatus === 'error' && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <XCircle size={64} color="#f44336" style={{ marginBottom: '24px' }} />
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>Upload Failed</h2>
                        <p style={{ color: '#aaa', marginBottom: '24px' }}>
                            There was an error uploading your video. Please try again.
                        </p>
                        <button
                            onClick={() => {
                                setUploadStatus(null);
                                setFile(null);
                                setTitle('');
                                setDescription('');
                                setTags('');
                            }}
                            style={{
                                padding: '12px 32px',
                                background: '#e50914',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default VideoUpload;
