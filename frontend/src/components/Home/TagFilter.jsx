import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchVideos } from '../../redux/slices/videoSlice';

const TagFilter = ({ tags }) => {
    const dispatch = useDispatch();
    const [selectedTags, setSelectedTags] = useState([]);

    const applyFilter = (nextSelected) => {
        if (nextSelected.length === 0) {
            // Clear all filters
            dispatch(fetchVideos());
        } else {
            // Multi-select tag filtering
            dispatch(fetchVideos({ tags: nextSelected }));
        }
    };

    const handleTagClick = (tagName) => {
        setSelectedTags((prev) => {
            const isSelected = prev.includes(tagName);
            const next = isSelected
                ? prev.filter((t) => t !== tagName)
                : [...prev, tagName];

            applyFilter(next);
            return next;
        });
    };

    const handleClear = () => {
        setSelectedTags([]);
        dispatch(fetchVideos());
    };

    const isTagSelected = (tagName) => selectedTags.includes(tagName);

    return (
        <div className="tag-filter">
            {/* Selected tags summary */}
            {selectedTags.length > 0 && (
                <div className="tag-filter__selected">
                    <span className="tag-filter__selected-label">Selected:</span>
                    {selectedTags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className="tag-filter__selected-chip"
                            onClick={() => handleTagClick(tag)}
                        >
                            <span className="tag-filter__selected-chip-text">{tag}</span>
                            <span className="tag-filter__selected-chip-remove">×</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Reset / Clear all filters */}
            <button
                onClick={handleClear}
                className={`tag-filter__btn ${selectedTags.length === 0 ? 'tag-filter__btn--active' : ''}`}
            >
                Clear Filters
            </button>

            {tags.map((tag) => (
                <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.name)}
                    className={[
                        'tag-filter__btn',
                        'tag-filter__btn--tag',
                        isTagSelected(tag.name) ? 'tag-filter__btn--active' : ''
                    ].join(' ')}
                >
                    {tag.name}
                </button>
            ))}
        </div>
    );
};

export default TagFilter;
