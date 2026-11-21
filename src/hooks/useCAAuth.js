import { useContext } from 'react';
import { CAAuthContext } from '../contexts/CAAuthContext';

export function useCAAuth() {
  const context = useContext(CAAuthContext);
  if (!context) {
    throw new Error('useCAAuth must be used within a CAAuthProvider');
  }
  return context;
}

export default useCAAuth;
