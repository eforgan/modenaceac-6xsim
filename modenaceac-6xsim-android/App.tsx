// App.tsx — Punto de entrada de la app Android 6XSIM
// Tablet Android 10" · orientación vertical

import React from 'react';
import { Alert, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TabNavigator from './src/navigation/TabNavigator';
import { Colors } from './src/theme';

const CONFIG_KEY  = '@6xsim_config';
const SYNC_KEY    = '@sync_queue';
const MAX_RETRIES = 3;

export default function App() {
  React.useEffect(() => {
    // Sincronizador Offline-First: se activa cuando hay conexión de red
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncPendingSessions();
      }
    });
    return () => unsubscribe();
  }, []);

  const syncPendingSessions = async () => {
    try {
      const cola = await AsyncStorage.getItem(SYNC_KEY);
      if (!cola) return;

      const sesiones: any[] = JSON.parse(cola);
      if (sesiones.length === 0) return;

      // Leer configuración del backend (IP y token separados de X-Plane)
      let apiIp    = '192.168.1.100';
      let apiToken = '';
      try {
        const rawCfg = await AsyncStorage.getItem(CONFIG_KEY);
        if (rawCfg) {
          const cfg = JSON.parse(rawCfg);
          if (cfg.api_ip)    apiIp    = cfg.api_ip;
          if (cfg.api_token) apiToken = cfg.api_token;
        }
      } catch {
        console.warn('[Sync] Error leyendo configuración, usando fallbacks.');
      }

      if (!apiToken) {
        console.warn('[Sync] Sin token de autenticación. Las sesiones quedan en cola hasta que se configure el token.');
        return;
      }

      const baseUrl  = `http://${apiIp}:3000`;
      const restantes: any[] = [];
      let syncOk     = 0;
      let syncFail   = 0;

      console.log(`[Sync] Iniciando sincronización: ${sesiones.length} sesión(es) pendiente(s) → ${baseUrl}`);

      for (const sesion of sesiones) {
        let intentos = 0;
        let subida   = false;

        while (intentos < MAX_RETRIES && !subida) {
          intentos++;
          try {
            // Mapear el formato local al formato que espera el backend
            const payload = {
              pilotoId:     sesion.pilotoId    ?? null,
              instructorId: sesion.instructorId ?? null,
              simuladorId:  sesion.simuladorId  ?? null,
              icao:         sesion.config?.icao          ?? 'SAEZ',
              horaLocal:    sesion.config?.hora_local     ?? '00:00',
              fecha:        new Date(sesion.hora_inicio ?? Date.now()).toISOString(),
              meteo:        sesion.config?.meteo ?? undefined,
              // Datos completos de finalización si ya está COMPLETADA
              ...(sesion.estado === 'COMPLETADA' ? {
                evaluacionGlobal: sesion.evaluacion_global,
                observaciones:    sesion.observaciones,
                firmaBase64:      sesion.firma_base64,
                evaluaciones:     (sesion.evaluaciones ?? []).map((e: any) => ({
                  maniobraId:    e.maniobra_id,
                  nombre:        e.maniobra_id,
                  resultado:     e.resultado,
                  observaciones: e.observaciones,
                })),
                fallasUsadas: (sesion.fallas_usadas ?? []).map((f: any) => ({
                  fallaId:  f.fallaId,
                  nombre:   f.nombre,
                  dataref:  f.dataref,
                  sistema:  f.sistema,
                  aeronave: f.aeronave,
                })),
              } : {}),
            };

            const resp = await fetch(`${baseUrl}/api/sesiones`, {
              method:  'POST',
              headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${apiToken}`,
              },
              body: JSON.stringify(payload),
            });

            if (resp.ok) {
              subida  = true;
              syncOk++;
              console.log(`[Sync] ✓ Sesión ${sesion.id} subida (intento ${intentos})`);
            } else {
              const errBody = await resp.json().catch(() => ({}));
              console.warn(`[Sync] ✗ Sesión ${sesion.id} — HTTP ${resp.status}: ${errBody.error ?? 'Error desconocido'} (intento ${intentos})`);
              if (resp.status === 401 || resp.status === 403) {
                // Token inválido — no tiene sentido reintentar
                break;
              }
            }
          } catch (netErr) {
            console.warn(`[Sync] ✗ Error de red al subir sesión ${sesion.id} (intento ${intentos}):`, netErr);
          }
        }

        if (!subida) {
          restantes.push(sesion);
          syncFail++;
        }
      }

      // Actualizar la cola con las que fallaron
      await AsyncStorage.setItem(SYNC_KEY, JSON.stringify(restantes));

      if (syncFail > 0) {
        console.warn(`[Sync] Resultado: ${syncOk} subidas, ${syncFail} fallaron y quedaron en cola.`);
      } else {
        console.log(`[Sync] Todas las sesiones sincronizadas (${syncOk}/${sesiones.length})`);
      }
    } catch (err) {
      console.error('[Sync] Error crítico en la cola de sincronización:', err);
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
