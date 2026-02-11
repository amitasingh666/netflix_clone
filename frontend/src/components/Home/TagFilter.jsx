import React from 'react';
import { useDispatch } from 'react-redux';
import { fetchVideos } from '../../redux/slices/videoSlice';

const TagFilter = ({ tags }) => {
    const dispatch = useDispatch();

    const handleTagClick = (tag) => {
        dispatch(fetchVideos({ tag }));
    };

    return (
        <div className="tag-filter">
            <button
                onClick={() => dispatch(fetchVideos())}
                className="tag-filter__btn"
            >
                All
            </button>
            {tags.map((tag) => (
                <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.name)}
                    className="tag-filter__btn tag-filter__btn--tag"
                >
                    {tag.name}
                </button>
            ))}
        </div>
    );
};

export default TagFilter;
