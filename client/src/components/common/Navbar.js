import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ userRole, userName, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      navigate('/login');
    }
  };

  const getDashboardPath = () => {
    switch (userRole) {
      case 'parent':
        return '/parent-dashboard';
      case 'child':
        return '/child-dashboard';
      case 'therapist':
        return '/therapist-dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
              🚀 Space Learning
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {userRole && (
              <>
                <button 
                  onClick={() => navigate(getDashboardPath())}
                  className="hover:text-purple-200 transition-colors"
                >
                  Dashboard
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Welcome, {userName || 'User'}</span>
                  <span className="px-2 py-1 bg-white/20 rounded text-xs">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}

            {!userRole && (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="hover:text-purple-200 transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;