import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator, // For loading state
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Chat from './Chat';
import { RegisterScreen, LoginScreen } from './Auth'; // Import new auth screens

function App(): React.JSX.Element {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false); // To toggle between login/register forms

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const token = await AsyncStorage.getItem('token');
        if (storedUsername && token) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleAuthSuccess = (loggedInUsername: string) => {
    setUsername(loggedInUsername);
    setIsRegistering(false); // Reset to login view if coming from register
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('token');
      setUsername(null);
    } catch (error) {
      console.error('Failed to clear auth data from storage', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!username) {
    if (isRegistering) {
      return <RegisterScreen onAuthSuccess={handleAuthSuccess} />;
    } else {
      return <LoginScreen onAuthSuccess={handleAuthSuccess} onSwitchToRegister={() => setIsRegistering(true)} />;
    }
  }

  return <Chat username={username} onLogout={handleLogout} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
