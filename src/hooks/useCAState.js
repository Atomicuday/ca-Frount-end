import { useContext } from 'react';
import { CAStateContext } from '../contexts/CAStateContext';

export function useCAState() {
  const context = useContext(CAStateContext);
  if (!context) {
    throw new Error('useCAState must be used within a CAStateProvider');
  }
  return context;
}

export default useCAState;
