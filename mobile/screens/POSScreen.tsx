
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, TextInput, Alert, Vibration } from 'react-native';
import { useMobileStore } from '../store';
import { Product, OrderItem } from '../types';

export const POSScreen = () => {
  const { products, createOrder, currentUser, logoutUser, refreshData } = useMobileStore();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableName, setTableName] = useState('');
  const [activeTab, setActiveTab] = useState('MENU'); // MENU | CART

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const [selectedCat, setSelectedCat] = useState('All');

  const filteredProducts = products.filter(p => selectedCat === 'All' || p.category === selectedCat);

  const addToCart = (product: Product) => {
    Vibration.vibrate(50);
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? {...i, quantity: i.quantity + 1} : i);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const sendOrder = async () => {
    if (cart.length === 0) return;
    try {
        await createOrder(cart, tableName || 'Mobile');
        Alert.alert('🔥 ENVOYÉ', 'La commande est partie en cuisine.');
        setCart([]);
        setTableName('');
        setActiveTab('MENU');
        refreshData();
    } catch (e) {
        Alert.alert('Erreur', 'Impossible d\'envoyer la commande');
    }
  };

  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>SMART FOOD POS</Text>
            <Text style={styles.headerSub}>{currentUser?.name.toUpperCase()} • {currentUser?.role}</Text>
        </View>
        <TouchableOpacity onPress={logoutUser} style={styles.lockBtn}>
            <Text style={styles.lockText}>VERROUILLER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('MENU')} style={[styles.tab, activeTab === 'MENU' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'MENU' && styles.activeTabText]}>CARTE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('CART')} style={[styles.tab, activeTab === 'CART' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'CART' && styles.activeTabText]}>PANIER ({cart.length})</Text>
          </TouchableOpacity>
      </View>

      {activeTab === 'MENU' ? (
        <View style={{ flex: 1 }}>
            <FlatList 
                horizontal 
                data={categories}
                showsHorizontalScrollIndicator={false}
                renderItem={({item}) => (
                    <TouchableOpacity 
                        style={[styles.catBadge, selectedCat === item && styles.activeCat]}
                        onPress={() => setSelectedCat(item)}
                    >
                        <Text style={[styles.catText, selectedCat === item && styles.activeCatText]}>{item.toUpperCase()}</Text>
                    </TouchableOpacity>
                )}
                keyExtractor={i => i}
                contentContainerStyle={styles.catList}
            />

            <FlatList 
                data={filteredProducts}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.productList}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
                        <Text style={styles.productName}>{item.name.toUpperCase()}</Text>
                        <Text style={styles.productPrice}>{item.price.toFixed(2)} €</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
      ) : (
        <View style={styles.cartContainer}>
            <TextInput 
                style={styles.input} 
                placeholder="N° TABLE OU CLIENT" 
                placeholderTextColor="#94a3b8"
                value={tableName}
                onChangeText={setTableName}
            />
            
            <FlatList 
                data={cart}
                keyExtractor={item => item.productId}
                renderItem={({item}) => (
                    <View style={styles.cartItem}>
                        <View style={styles.qtyCircle}><Text style={styles.qtyText}>{item.quantity}</Text></View>
                        <Text style={styles.cartName}>{item.name.toUpperCase()}</Text>
                        <Text style={styles.cartPrice}>{(item.price * item.quantity).toFixed(2)} €</Text>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
                    <Text style={styles.totalAmount}>{total.toFixed(2)} €</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.sendButton, cart.length === 0 && styles.disabledButton]}
                    onPress={sendOrder}
                    disabled={cart.length === 0}
                >
                    <Text style={styles.sendButtonText}>ENVOYER EN CUISINE</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#10b981', fontWeight: '900', fontSize: 20, letterSpacing: -1 },
  headerSub: { color: '#64748b', fontSize: 10, fontWeight: '900', marginTop: 2 },
  lockBtn: { borderWeb: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  lockText: { color: '#94a3b8', fontSize: 10, fontWeight: '900' },
  
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, padding: 18, alignItems: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#0f172a' },
  tabText: { fontWeight: '900', color: '#94a3b8', fontSize: 12 },
  activeTabText: { color: '#0f172a' },

  catList: { padding: 15, height: 80 },
  catBadge: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, marginRight: 10, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center' },
  activeCat: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catText: { color: '#64748b', fontWeight: '900', fontSize: 10 },
  activeCatText: { color: '#fff' },

  productList: { padding: 10 },
  productCard: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 20, padding: 20, height: 140, justifyContent: 'space-between', borderWidth: 2, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  productName: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  productPrice: { fontSize: 16, color: '#10b981', fontWeight: '900' },

  cartContainer: { flex: 1, padding: 20 },
  input: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 20, fontSize: 16, fontWeight: '900', borderWidth: 2, borderColor: '#e2e8f0', color: '#0f172a' },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  qtyCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qtyText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  cartName: { flex: 1, fontWeight: '900', color: '#0f172a', fontSize: 11 },
  cartPrice: { fontWeight: '900', color: '#0f172a', fontSize: 14 },
  
  footer: { marginTop: 'auto', paddingTop: 20, borderTopWidth: 2, borderColor: '#f1f5f9' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 14, fontWeight: '900', color: '#64748b' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -2 },
  sendButton: { backgroundColor: '#10b981', padding: 22, borderRadius: 20, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  disabledButton: { backgroundColor: '#e2e8f0', shadowOpacity: 0 },
  sendButtonText: { color: '#fff', fontWeight: '900', fontSize: 18 }
});
