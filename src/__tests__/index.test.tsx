import { NativeModules, Platform } from 'react-native';

// Must exist before src/index is imported, or the linking-error proxy trips.
NativeModules.TerraRtReact = {
  connectDevice: jest.fn(async () => ({ success: true, error: null })),
  startForegroundService: jest.fn(async () => ({ success: true, error: null })),
  stopForegroundService: jest.fn(async () => ({ success: true, error: null })),
  isIgnoringBatteryOptimizations: jest.fn(async () => false),
  requestIgnoreBatteryOptimizations: jest.fn(async () => true),
};

// require, not import: imports hoist above the NativeModules assignment,
// which would capture the linking-error proxy instead of the mock.
const {
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
  startForegroundService,
  stopForegroundService,
} = require('../index');

const native = NativeModules.TerraRtReact;

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
