import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MobileProvider, useMobileStore } from './store';
import { LoginScreen } from './screens/LoginScreen';
import { POSScreen } from './screens/POSScreen';
import { SaaSLoginScreen } from './screens/SaaSLoginScreen';

const MainNavigator = () => {
  const { currentUser, restaurant, isLoading } = useMobileStore();

  if (isLoading) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a'}}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={{color: 'white', marginTop: 20}}>Chargement...</Text>
          </View>
      );
  }

  // 1. Si aucun restaurant sélectionné, on affiche le SaaS Login
  if (!restaurant) {
      return <SaaSLoginScreen />;
  }

  // 2. Si restaurant OK mais pas de user, on affiche le PIN Pad
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 3. Sinon on affiche le POS
  return <POSScreen />;
};

export default function App() {
  return (
    <MobileProvider>
      <MainNavigator />
    </MobileProvider>
  );
}