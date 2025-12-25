import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, SafeAreaView, Alert } from 'react-native';
import { useMobileStore } from '../store';
import { User } from '../types';

export const LoginScreen = () => {
  const { users, loginUser, logoutRestaurant, restaurant } = useMobileStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    if (loginUser(pin)) {
      // Navigation is handled by App.tsx based on user state
    } else {
      Alert.alert('Erreur', 'Code PIN incorrect');
      setPin('');
    }
  };

  const confirmExit = () => {
      Alert.alert(
          'Déconnexion',
          'Voulez-vous changer de restaurant ?',
          [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Quitter', style: 'destructive', onPress: logoutRestaurant }
          ]
      );
  }

  if (!selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            <TouchableOpacity onPress={confirmExit}>
                <Text style={styles.exitText}>Quitter</Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.title}>Qui êtes-vous ?</Text>
        <View style={styles.grid}>
          {users.length === 0 && (
              <Text style={{color: '#94a3b8', textAlign: 'center'}}>Aucun utilisateur configuré.</Text>
          )}
          {users.map(u => (
            <TouchableOpacity 
              key={u.id} 
              style={styles.userCard} 
              onPress={() => setSelectedUser(u)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name.substring(0,2).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{u.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Bonjour, {selectedUser.name}</Text>
      <Text style={styles.subtitle}>Entrez votre code PIN</Text>

      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
        placeholder="••••"
        placeholderTextColor="#ccc"
      />

      <TouchableOpacity 
        style={[styles.loginButton, pin.length < 4 && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={pin.length < 4}
      >
        <Text style={styles.loginButtonText}>Connexion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', padding: 20 },
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restaurantName: { color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  exitText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 30, marginTop: 40 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  userCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, alignItems: 'center', width: 100, marginBottom: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  userName: { fontWeight: '600', color: '#334155' },
  backButton: { position: 'absolute', top: 50, left: 20 },
  backText: { color: '#94a3b8', fontSize: 16 },
  pinInput: { backgroundColor: 'white', fontSize: 32, textAlign: 'center', padding: 15, borderRadius: 10, letterSpacing: 10, marginBottom: 20 },
  loginButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});