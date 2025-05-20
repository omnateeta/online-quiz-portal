import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
};

export default StudentRoute; 