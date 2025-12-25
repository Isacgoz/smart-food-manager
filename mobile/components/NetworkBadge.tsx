import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getQueueSize } from '../services/offlineQueue';

export const NetworkBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    // Queue size check (toutes les 5s)
    const interval = setInterval(async () => {
      const size = await getQueueSize();
      setQueueSize(size);
    }, 5000);

    // Initial check
    getQueueSize().then(setQueueSize);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueSize === 0) return null;

  return (
    <View style={[styles.badge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
      <Text style={styles.icon}>{isOnline ? '🟢' : '🔴'}</Text>
      <Text style={styles.text}>
        {isOnline ? 'En ligne' : 'Hors-ligne'}
      </Text>
      {queueSize > 0 && (
        <Text style={styles.queue}>({queueSize} en attente)</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 40,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  badgeOnline: {
    backgroundColor: '#10b981',
  },
  badgeOffline: {
    backgroundColor: '#ef4444',
  },
  icon: {
    fontSize: 12,
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  queue: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.9,
  },
});
