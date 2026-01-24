import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useMobileStore } from '../store';
import { RestaurantProfile } from '../types';

export const SaaSLoginScreen = () => {
  const { loginRestaurant } = useMobileStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
    }

    // SIMULATION AUTHENTICATION
    // Dans une vraie app, cela appellerait une API
    // Ici, on simule une connexion réussie si l'utilisateur entre n'importe quoi, 
    // ou on recrée un profil fictif pour "lier" l'appareil.
    
    // Pour que cela marche avec la démo Web, on va créer un ID basé sur l'email
    // Note: Sans backend réel partagé, les données ne seront pas synchronisées entre Web et Mobile
    // sauf si Supabase est configuré dans services/storage.ts.
    
    const mockId = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const profile: RestaurantProfile = {
        id: mockId, // On essaie de deviner l'ID basé sur l'email pour la démo
        name: email.split('@')[0],
        ownerEmail: email,
        plan: 'SOLO',
        createdAt: new Date().toISOString()
    };

    Alert.alert(
        'Connexion Mobile',
        `Bienvenue dans l'espace de "${profile.name}".\n\nNote: En mode démo (sans serveur), les données sont stockées localement sur ce téléphone.`,
        [
            { text: 'Commencer', onPress: () => loginRestaurant(profile) }
        ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>👨‍🍳</Text>
                </View>
                <Text style={styles.title}>Smart Food</Text>
                <Text style={styles.subtitle}>Espace Mobile</Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.formTitle}>Connexion Restaurant</Text>
                
                <Text style={styles.label}>Email du Gérant</Text>
                <TextInput
                    style={styles.input}
                    placeholder="gerant@restaurant.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Se Connecter</Text>
                </TouchableOpacity>

                <Text style={styles.infoText}>
                    Utilisez les mêmes identifiants que sur la version Web pour accéder à votre restaurant.
                </Text>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, backgroundColor: '#10b981', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10 },
  logoIcon: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: '900', color: 'white' },
  subtitle: { fontSize: 18, color: '#94a3b8', marginTop: 5 },
  
  formCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  label: { color: '#cbd5e1', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#334155', borderRadius: 12, padding: 15, color: 'white', marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  infoText: { color: '#64748b', textAlign: 'center', marginTop: 20, fontSize: 12, lineHeight: 18 }
});