import React from 'react';

const Loading = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="loading-spinner dark:loading-spinner-dark mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );
};

export default Loading;