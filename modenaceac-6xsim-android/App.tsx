// App.tsx — Punto de entrada de la app Android 6XSIM
// Tablet Android 10" · orientación vertical · modo oscuro no soportado

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TabNavigator from './src/navigation/TabNavigator';
import { Colors } from './src/theme';

export default function App() {
  React.useEffect(() => {
    // Sincronizador Offline-First en background
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncPendingSessions();
      }
    });

    return () => unsubscribe();
  }, []);

  const syncPendingSessions = async () => {
    try {
      const cola = await AsyncStorage.getItem('@sync_queue');
      if (!cola) return;
      const sesiones = JSON.parse(cola);
      if (sesiones.length === 0) return;

      console.log(`[Sync] Intentando subir ${sesiones.length} sesiones pendientes...`);
      const restantes = [];

      for (const sesion of sesiones) {
        try {
          // Asumiendo que el backend corre en el mismo servidor en puerto 3000
          // (idealmente esto debería leer de la configStore)
          const resp = await fetch('http://192.168.1.10:3000/api/sesiones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sesion),
          });
          
          if (!resp.ok) {
            restantes.push(sesion);
            console.warn(`[Sync] Falla al subir sesión ${sesion.id}, código:`, resp.status);
          } else {
            console.log(`[Sync] Sesión ${sesion.id} subida con éxito`);
          }
        } catch (e) {
          restantes.push(sesion);
        }
      }

      await AsyncStorage.setItem('@sync_queue', JSON.stringify(restantes));
    } catch (e) {
      console.error('[Sync] Error leyendo cola de sesiones:', e);
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.white}
        />
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
