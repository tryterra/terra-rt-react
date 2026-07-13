import { NativeModules, Platform } from 'react-native';
import type { Device, GetUserId, SuccessMessage } from './types';
import type { Connections, DataTypes } from './enums';

export * from './types';
export * from './enums';

const LINKING_ERROR =
  `The package 'terra-rt' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const TerraRtReact = NativeModules.TerraRtReact
  ? NativeModules.TerraRtReact
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function initTerra(
  devId: String,
  referenceId?: String
): Promise<SuccessMessage> {
  return TerraRtReact.initTerra(devId, referenceId);
}

export function initConnection(token: String): Promise<SuccessMessage> {
  return TerraRtReact.initConnection(token);
}

export function getUserId(): Promise<GetUserId> {
  return TerraRtReact.getUserId();
}

export function startDeviceScan(
  connections: Connections,
  useCache: Boolean = false,
  showWidgetIfCacheNotFound: Boolean = false
): Promise<SuccessMessage> {
  return TerraRtReact.startDeviceScan(
    connections,
    useCache,
    showWidgetIfCacheNotFound
  );
}

export function startDeviceScanWithCallback(
  connections: Connections
): Promise<SuccessMessage> {
  if (Platform.OS === 'ios') {
    return TerraRtReact.startBluetoothScan(connections);
  } else {
    return TerraRtReact.startDeviceScanWithCallback(connections);
  }
}

export function connectDevice(device: Device): Promise<SuccessMessage> {
  return TerraRtReact.connectDevice(device.id);
}

export function startRealtime(
  connections: Connections,
  dataTypes: Array<DataTypes>,
  token: String | null = null
): Promise<SuccessMessage> {
  return TerraRtReact.startRealtime(connections, dataTypes, token);
}

export function stopRealtime(
  connections: Connections
): Promise<SuccessMessage> {
  return TerraRtReact.stopRealtime(connections);
}

export function disconnect(connections: Connections): Promise<SuccessMessage> {
  return TerraRtReact.disconnect(connections);
}

export function connectWithWatchOS(): Promise<SuccessMessage> {
  return TerraRtReact.connectWithWatchOS();
}

/**
 * ANDROID ONLY. Customizes the persistent notification shown while
 * streaming and (re)starts the streaming foreground service. As of
 * terra-rtandroid 0.4.12 the service lifecycle is managed by the SDK
 * (startRealtime starts it; stopRealtime/disconnect stop it) — call this
 * only to override the default notification content. No-op on iOS.
 */
export function startForegroundService(
  notificationTitle: string,
  notificationText: string
): Promise<SuccessMessage> {
  if (Platform.OS !== 'android') {
    return Promise.resolve({ success: true, error: null });
  }
  return TerraRtReact.startForegroundService(notificationTitle, notificationText);
}

/** ANDROID ONLY. Stops the streaming foreground service. No-op on iOS. */
export function stopForegroundService(): Promise<SuccessMessage> {
  if (Platform.OS !== 'android') {
    return Promise.resolve({ success: true, error: null });
  }
  return TerraRtReact.stopForegroundService();
}

/**
 * ANDROID ONLY. Whether the app is exempt from battery optimizations —
 * aggressive OEM battery managers can kill background streaming without
 * the exemption. Always true on iOS.
 */
export function isIgnoringBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(true);
  }
  return TerraRtReact.isIgnoringBatteryOptimizations();
}

/**
 * ANDROID ONLY. Opens the system dialog asking the user to exempt the app
 * from battery optimizations. Resolves false if the dialog can't open.
 * No-op (true) on iOS.
 */
export function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(true);
  }
  return TerraRtReact.requestIgnoreBatteryOptimizations();
}
