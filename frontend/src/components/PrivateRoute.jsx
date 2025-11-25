import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../selectors/authSelectors';

const PrivateRoute = ({ role }) => {
  const user = useSelector(selectUser);

  if (!user) {
    return <Navigate to='/login' />;
  }

  // Se o usuário existe mas não tem role definida, algo está errado (dados corrompidos ou incompletos)
  if (user && !user.role) {
    // Forçar logout ou redirecionar para login
    return <Navigate to='/login' />;
  }

  if (role && user.role && user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return <Outlet />;
};

export default PrivateRoute;