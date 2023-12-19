import { NativeModules, Platform } from 'react-native';
import type { Device, GetUserId, SuccessMessage } from './types';
import type { Connections, DataTypes } from './enums';

export * from './types';
export * from './enums';

const LINKING_ERROR =
  `The package 'react-native-terra-rt-react' doesn't seem to be linked. Make sure: \n\n` +
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
