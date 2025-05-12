import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const { setToken } = useUserContext();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Get user info from Google
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }
        );

        // Send the token to your backend
        const backendResponse = await axios.post(
          'http://localhost:8080/api/auth/google',
          {
            email: userInfo.data.email,
            name: userInfo.data.name,
            googleId: userInfo.data.sub,
            picture: userInfo.data.picture,
          }
        );

        // Store the JWT token
        const { token, user } = backendResponse.data;
        setToken(token);
        localStorage.setItem('token', token);
        
        toast.success('Successfully signed in with Google!');
        navigate('/');
      } catch (error) {
        console.error('Error during Google login:', error);
        const errorMessage = error.response?.data || 'Failed to sign in with Google. Please try again.';
        toast.error(errorMessage);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    },
  });

  return (
    <button
      onClick={() => login()}
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        className="w-5 h-5 mr-2"
      />
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton; 