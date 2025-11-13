import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../selectors/authSelectors';

const PrivateRoute = ({ role }) => {
  const user = useSelector(selectUser);

  // Se não estiver logado, redirecionar para login
  if (!user) {
    return <Navigate to='/login' />;
  }

  // Se o papel do usuário não corresponder ao papel necessário, redirecionar para o dashboard apropriado
  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return <Outlet />;
};

export default PrivateRoute;