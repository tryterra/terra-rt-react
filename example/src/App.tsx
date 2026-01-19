/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { NativeEventEmitter, NativeModules } from 'react-native';

import {
  initTerra,
  initConnection,
  startDeviceScan,
  startRealtime,
  stopRealtime,
  disconnect,
  getUserId,
} from 'react-native-terra-rt-react';
import { config } from './config';
import type {
  Device,
  SuccessMessage,
  Update,
} from 'react-native-terra-rt-react';
import { Connections, DataTypes } from 'react-native-terra-rt-react';
import { BLWidget } from './iOSBleWidget';

export default function App() {
  const [initialised, setInitialised] = React.useState<Boolean>(false);
  const [connected, setConnected] = React.useState<Boolean>(false);
  const [streaming, setStreaming] = React.useState<Boolean>(false);
  const [hr, setHr] = React.useState<number>(0);
  const [displayWidget, setDisplayWidget] = React.useState<Boolean>(false);

  const connection = Connections.BLE;
  const dataTypes = [DataTypes.HEART_RATE];
  React.useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.UpdateHandler);
    eventEmitter.addListener('Update', (event: Update) => {
      console.log(event);
      setHr(event.val == null ? 0 : Math.round(event.val));
    });

    const deviceEmitter = new NativeEventEmitter(NativeModules.DeviceHandler);
    deviceEmitter.addListener('Device', async (event: Device) => {
      console.log(event);
    });

    const connectionHandler = new NativeEventEmitter(
      NativeModules.ConnectionHandler
    );
    connectionHandler.addListener(
      'ConnectionUpdate',
      async (event: boolean) => {
        console.log('connectionhandler', event);
      }
    );

    initTerra(config.devId, 'tony_starks')
      .then((d: SuccessMessage) => {
        console.log(d);
        getAuthToken()
          .then((response: any) => response.json())
          .then((result) => {
            initConnection(result.token)
              .then((d_: SuccessMessage) => {
                console.log(d_);
                setInitialised(d_.success);
              })
              .catch((e: any) => {
                console.log(e);
              });
          })
          .catch((e: any) => {
            Alert.alert(
              'Config Missing',
              'Please add variables to config file'
            );
            console.log(e);
          });
      })
      .catch((e: any) => {
        console.log(e);
      });
  }, []);

  const startScanning = () => {
    if (Platform.OS === 'android') {
      startDeviceScan(connection)
        .then((d: SuccessMessage) => {
          setConnected(d.success);
          console.log(d.success, 'connection complete');
        })
        .catch((e: any) => {
          console.log(e);
        });
    } else {
      setDisplayWidget(true);
      setConnected(true);
    }
  };

  const startStreaming = async () => {
    try {
      const userId = await getUserId();
      if (userId.userId == null) {
        return;
      }
      const token = await (await getStreamToken(userId.userId)).json();
      await startRealtime(connection, dataTypes, token.token);
      setStreaming(true);
      console.log('Streaming');
    } catch (e: any) {
      console.log(e);
    }
  };

  const getAuthToken = () => {
    const devId = config.devId;
    const apiKey = config.apiKey;
    return fetch('https://api.tryterra.co/v2/auth/generateAuthToken', {
      method: 'POST',
      headers: {
        'dev-id': devId,
        'x-api-key': apiKey,
      },
    });
  };

  const getStreamToken = (userId: String) => {
    const devId = config.devId;
    const apiKey = config.apiKey;
    return fetch(`https://ws.tryterra.co/auth/user?id=${userId}`, {
      method: 'POST',
      headers: {
        'dev-id': devId,
        'x-api-key': apiKey,
      },
    });
  };

  const disconnect_ = async () => {
    try {
      await stopRealtime(connection);
      await disconnect(connection);
      setConnected(false);
      setStreaming(false);
    } catch (e: any) {
      console.log(e);
    }
  };

  const _onSuccessfulConnection = (e: any) => {
    setDisplayWidget(false);
    setConnected(e.nativeEvent.success);
    console.log(displayWidget);
  };

  // const _startDeviceScan = (_: any) => {
  //   startDeviceScanWithCallback(connection);
  // };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' && displayWidget && (
        <BLWidget
          // @ts-expect-error withCache is not in the component's type defs
          withCache={false}
          onSuccessfulConnection={_onSuccessfulConnection}
        />
      )}
      <Image
        source={require('./img/terra_logo.png')}
        style={{ marginBottom: 32 }}
      />
      <TouchableOpacity
        style={styles.scanButton}
        onPress={startScanning}
        disabled={!initialised.valueOf() || connected.valueOf()}
      >
        <Text style={styles.scanText}>Start Scan</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.streamButton}
        onPress={startStreaming}
        disabled={
          !initialised.valueOf() || !connected.valueOf() || streaming.valueOf()
        }
      >
        <Text style={styles.scanText}>Start Streaming</Text>
      </TouchableOpacity>
      <View style={styles.heartRateContainer}>
        <Image source={require('./img/heart.png')} />
        <Text style={styles.hrText}>{hr}</Text>
      </View>
      <View style={styles.disconnectButtonContainer}>
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={disconnect_}
          disabled={!initialised || !(streaming && connected)}
        >
          <Text style={styles.scanText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  bleWidget: {
    flex: 1,
  },
  scanButton: {
    width: '80%',
    height: 48,
    backgroundColor: '#1E293A',
    borderRadius: 6.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    fontFamily: 'ArialMT',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  streamButton: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#60A5FA',
    marginTop: 16,
    borderRadius: 6.5,
  },
  heartRateContainer: {
    borderRadius: 24,
    width: '50%',
    height: 48,
    justifyContent: 'center',
    marginTop: 30,
    gap: 15,
    alignItems: 'center',
    backgroundColor: '#BCE0FE',
    flexDirection: 'row',
  },
  hrText: {
    fontFamily: 'ArialMT',
    fontWeight: 'bold',
    fontSize: 20,
    color: '#30A4FB',
  },
  disconnectButtonContainer: {
    height: '40%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#1E293A',
    borderRadius: 6.5,
    width: '55%',
    height: 33.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
