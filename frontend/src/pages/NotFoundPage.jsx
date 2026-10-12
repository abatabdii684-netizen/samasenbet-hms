import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
            Page Not Found
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Go Back
          </button>
          <Link to="/dashboard" className="btn-primary">
            <HomeIcon className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
