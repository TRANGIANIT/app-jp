import React, { createContext, useState, useEffect, useContext } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let soundObject = null;
    
    async function loadAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        // Using a reliable royalty-free lofi URL as placeholder
        // Suggestion: You should download this and put in assets/lofi.mp3 for production!
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3' },
          { shouldPlay: false, isLooping: true }
        );
        
        soundObject = audioSound;
        setSound(audioSound);

        // Check user preferences
        const savedPref = await AsyncStorage.getItem('music_playing');
        if (savedPref === 'true') {
          await audioSound.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.warn("Lỗi tải nhạc:", error);
      }
    }

    loadAudio();

    return () => {
      if (soundObject) {
         soundObject.unloadAsync();
      }
    };
  }, []);

  const toggleMusic = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      await AsyncStorage.setItem('music_playing', 'false');
    } else {
      await sound.playAsync();
      setIsPlaying(true);
      await AsyncStorage.setItem('music_playing', 'true');
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, toggleMusic }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
