import React from 'react';


interface ExerciseSearchBarProps {
    searchQuery: string;
    setSearchQuery: (searchQuery: string) => void;
}


const ExerciseSearchBar: React.FC<ExerciseSearchBarProps> = ({ searchQuery, setSearchQuery }) => {
    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }

    return (
        <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery} 
            onChange={handleSearchChange}
            className="w-full max-w-lg p-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
        />
    );
};

export default ExerciseSearchBar;