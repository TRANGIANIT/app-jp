import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { BookOpen, HelpCircle, Trophy, User } from 'lucide-react-native';

// Import Screens (Sẽ tạo sau)
import FlashcardsScreen from '../screens/FlashcardsScreen';
import QuizScreen from '../screens/QuizScreen';
import JLPTTestScreen from '../screens/JLPTTestScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#e53e3e',
          tabBarInactiveTintColor: '#718096',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen 
          name="Flashcards" 
          component={FlashcardsScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
            title: 'Thẻ học'
          }}
        />
        <Tab.Screen 
          name="Quiz" 
          component={QuizScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size} />,
            title: 'Quiz'
          }}
        />
        <Tab.Screen 
          name="JLPT" 
          component={JLPTTestScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
            title: 'Luyện JLPT'
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            title: 'Cá nhân'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
