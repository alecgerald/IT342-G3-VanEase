import { GoogleOAuthProvider } from '@react-oauth/google';

// Temporarily hardcode the client ID for testing
const GOOGLE_CLIENT_ID = '1012058336160-7d76iq4sdrubnr5cnpubk7e40rfcha2c.apps.googleusercontent.com';

// Add console log to check the client ID
console.log('Google Client ID:', GOOGLE_CLIENT_ID);

const GoogleAuthProvider = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthProvider; 