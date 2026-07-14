import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import type { Device, GetUserId, SuccessMessage, Update } from './types';
import { Connections } from './enums';
import type { DataTypes } from './enums';

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

/**
 * Whether the native module is present. False in Expo Go or any build
 * without the native side — check this to degrade gracefully instead of
 * catching the linking error.
 */
export function isTerraRtAvailable(): boolean {
  return NativeModules.TerraRtReact != null;
}

/**
 * 'PHONE' means the phone's own sensors; the native SDKs name it per
 * platform (APPLE / ANDROID). All connection-taking functions accept it.
 */
export type ConnectionInput = Connections | 'PHONE';

function toNativeConnection(connections: ConnectionInput): Connections {
  if (connections === 'PHONE') {
    return Platform.OS === 'ios' ? Connections.APPLE : Connections.ANDROID;
  }
  return connections;
}

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

function scanPermissionList() {
  const wanted =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  return wanted.filter((p): p is NonNullable<typeof p> => p != null);
}

/**
 * ANDROID ONLY (resolves true on iOS). Requests the runtime permissions a
 * BLE scan needs: BLUETOOTH_SCAN/CONNECT on Android 12+, fine location
 * below. Without them Android scans "succeed" and silently find nothing.
 */
export async function requestScanPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const results = await PermissionsAndroid.requestMultiple(
    scanPermissionList()
  );
  return Object.values(results).every(
    (r) => r === PermissionsAndroid.RESULTS.GRANTED
  );
}

async function hasScanPermissions(): Promise<boolean> {
  const checks = await Promise.all(
    scanPermissionList().map((p) => PermissionsAndroid.check(p))
  );
  return checks.every(Boolean);
}

/**
 * Starts a callback-driven device scan (devices arrive via onDeviceFound).
 * On Android the required runtime permissions are requested first unless
 * `requestPermissions` is false; missing permissions REJECT loudly instead
 * of the native behavior of scanning successfully and finding nothing.
 */
export async function startDeviceScanWithCallback(
  connections: ConnectionInput,
  options: { requestPermissions?: boolean } = {}
): Promise<SuccessMessage> {
  const { requestPermissions = true } = options;
  if (Platform.OS === 'android') {
    const granted = requestPermissions
      ? await requestScanPermissions()
      : await hasScanPermissions();
    if (!granted) {
      throw new Error(
        'Bluetooth scan permissions not granted — call requestScanPermissions() or enable Nearby devices for this app in Android Settings'
      );
    }
  }
  const connection = toNativeConnection(connections);
  if (Platform.OS === 'ios') {
    return TerraRtReact.startBluetoothScan(connection);
  } else {
    return TerraRtReact.startDeviceScanWithCallback(connection);
  }
}

/**
 * Stops a scan started by startDeviceScanWithCallback. Safe to call when
 * nothing is scanning. Restarting a wedged scan is stop → start.
 */
export function stopDeviceScan(
  connections: ConnectionInput
): Promise<SuccessMessage> {
  return TerraRtReact.stopDeviceScan(toNativeConnection(connections));
}

export function connectDevice(device: Device): Promise<SuccessMessage> {
  return TerraRtReact.connectDevice(device.id);
}

export function startRealtime(
  connections: ConnectionInput,
  dataTypes: Array<DataTypes>,
  token: String | null = null
): Promise<SuccessMessage> {
  return TerraRtReact.startRealtime(
    toNativeConnection(connections),
    dataTypes,
    token
  );
}

export function stopRealtime(
  connections: ConnectionInput
): Promise<SuccessMessage> {
  return TerraRtReact.stopRealtime(toNativeConnection(connections));
}

export function disconnect(
  connections: ConnectionInput
): Promise<SuccessMessage> {
  return TerraRtReact.disconnect(toNativeConnection(connections));
}

/* ------------------------- Typed event streams ------------------------- */
// iOS emits from dedicated native handler modules; Android emits on the
// global RCTDeviceEventEmitter (no module argument). Same event names.

function emitterFor(iosModule: any): NativeEventEmitter {
  return new NativeEventEmitter(Platform.OS === 'ios' ? iosModule : undefined);
}

/** Devices discovered by startDeviceScanWithCallback. Returns unsubscribe. */
export function onDeviceFound(cb: (device: Device) => void): () => void {
  const sub = emitterFor(NativeModules.DeviceHandler).addListener(
    'Device',
    (d: any) =>
      cb({
        id: d?.id != null ? String(d.id) : null,
        name: d?.name != null ? String(d.name) : null,
        type: d?.type != null ? String(d.type) : '',
      })
  );
  return () => sub.remove();
}

/** Data points from the active stream. Returns unsubscribe. */
export function onUpdate(cb: (update: Update) => void): () => void {
  const sub = emitterFor(NativeModules.UpdateHandler).addListener(
    'Update',
    (u: any) =>
      cb({
        type: u?.type ?? null,
        ts: u?.ts ?? null,
        val: u?.val ?? null,
        d: u?.d ?? null,
      })
  );
  return () => sub.remove();
}

/** The SDK's websocket-to-Terra connection state. Returns unsubscribe. */
export function onConnectionUpdate(
  cb: (connected: boolean) => void
): () => void {
  const sub = emitterFor(NativeModules.ConnectionHandler).addListener(
    'ConnectionUpdate',
    (connected: any) => cb(!!connected)
  );
  return () => sub.remove();
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
  return TerraRtReact.startForegroundService(
    notificationTitle,
    notificationText
  );
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
