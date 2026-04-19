import 'react-native-gesture-handler';
import React from 'react';
import AppNavigation from './src/navigation/AppNavigation';
import SakuraAnimation from './src/components/layout/SakuraAnimation';
import { AudioProvider } from './src/logic/AudioContext';

export default function App() {
  return (
    <AudioProvider>
      <SakuraAnimation>
          <AppNavigation />
      </SakuraAnimation>
    </AudioProvider>
  );
}
