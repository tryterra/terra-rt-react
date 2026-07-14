import {
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

// Must exist before src/index is imported, or the linking-error proxy trips.
NativeModules.TerraRtReact = {
  connectDevice: jest.fn(async () => ({ success: true, error: null })),
  startForegroundService: jest.fn(async () => ({ success: true, error: null })),
  stopForegroundService: jest.fn(async () => ({ success: true, error: null })),
  isIgnoringBatteryOptimizations: jest.fn(async () => false),
  requestIgnoreBatteryOptimizations: jest.fn(async () => true),
  stopDeviceScan: jest.fn(async () => ({ success: true, error: null })),
  stopRealtime: jest.fn(async () => ({ success: true, error: null })),
  startDeviceScanWithCallback: jest.fn(async () => ({
    success: true,
    error: null,
  })),
};

// require, not import: imports hoist above the NativeModules assignment,
// which would capture the linking-error proxy instead of the mock.
const {
  isIgnoringBatteryOptimizations,
  onUpdate,
  requestIgnoreBatteryOptimizations,
  startDeviceScanWithCallback,
  startForegroundService,
  stopDeviceScan,
  stopForegroundService,
  stopRealtime,
} = require('../index');

const native = NativeModules.TerraRtReact;

describe('scan control + platform mapping', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
  });

  it('stopDeviceScan calls through with the connection', async () => {
    await stopDeviceScan('BLE');
    expect(native.stopDeviceScan).toHaveBeenCalledWith('BLE');
  });

  it("maps 'PHONE' to the platform's native connection name", async () => {
    await stopRealtime('PHONE');
    expect(native.stopRealtime).toHaveBeenCalledWith('ANDROID');

    Platform.OS = 'ios';
    await stopRealtime('PHONE');
    expect(native.stopRealtime).toHaveBeenCalledWith('APPLE');
  });
});

describe('background-streaming API (android)', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
  });

  it('startForegroundService forwards the notification content', async () => {
    const res = await startForegroundService('Terra', 'Streaming live data');
    expect(native.startForegroundService).toHaveBeenCalledWith(
      'Terra',
      'Streaming live data'
    );
    expect(res).toEqual({ success: true, error: null });
  });

  it('stopForegroundService calls through', async () => {
    await stopForegroundService();
    expect(native.stopForegroundService).toHaveBeenCalled();
  });

  it('battery-optimization helpers call through', async () => {
    await expect(isIgnoringBatteryOptimizations()).resolves.toBe(false);
    await expect(requestIgnoreBatteryOptimizations()).resolves.toBe(true);
    expect(native.isIgnoringBatteryOptimizations).toHaveBeenCalled();
    expect(native.requestIgnoreBatteryOptimizations).toHaveBeenCalled();
  });
});

describe('android scan-permission gate', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
  });

  it('rejects loudly when permissions are denied', async () => {
    jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValueOnce({
      'android.permission.BLUETOOTH_SCAN': 'denied',
    } as any);
    await expect(startDeviceScanWithCallback('BLE')).rejects.toThrow(
      /permissions not granted/i
    );
    expect(native.startDeviceScanWithCallback).not.toHaveBeenCalled();
  });

  it('scans once permissions are granted, with the mapped connection', async () => {
    jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValueOnce({
      'android.permission.BLUETOOTH_SCAN': 'granted',
      'android.permission.BLUETOOTH_CONNECT': 'granted',
    } as any);
    await startDeviceScanWithCallback('PHONE');
    expect(native.startDeviceScanWithCallback).toHaveBeenCalledWith('ANDROID');
  });
});

describe('typed event streams', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  it('onUpdate delivers normalized payloads and unsubscribes cleanly', () => {
    const updates: any[] = [];
    const unsubscribe = onUpdate((u: any) => updates.push(u));

    DeviceEventEmitter.emit('Update', { type: 'HEART_RATE', val: 62 });
    DeviceEventEmitter.emit('Update', { type: 'ACCELERATION', d: [0, 0, 1] });

    expect(updates).toEqual([
      { type: 'HEART_RATE', ts: null, val: 62, d: null },
      { type: 'ACCELERATION', ts: null, val: null, d: [0, 0, 1] },
    ]);

    unsubscribe();
    DeviceEventEmitter.emit('Update', { type: 'HEART_RATE', val: 70 });
    expect(updates).toHaveLength(2);
  });
});

describe('background-streaming API (ios no-ops)', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
  });

  it('resolves successfully without touching the native module', async () => {
    await expect(startForegroundService('t', 'x')).resolves.toEqual({
      success: true,
      error: null,
    });
    await expect(stopForegroundService()).resolves.toEqual({
      success: true,
      error: null,
    });
    await expect(isIgnoringBatteryOptimizations()).resolves.toBe(true);
    await expect(requestIgnoreBatteryOptimizations()).resolves.toBe(true);
    expect(native.startForegroundService).not.toHaveBeenCalled();
    expect(native.stopForegroundService).not.toHaveBeenCalled();
    expect(native.isIgnoringBatteryOptimizations).not.toHaveBeenCalled();
    expect(native.requestIgnoreBatteryOptimizations).not.toHaveBeenCalled();
  });
});
