# react-native-terra-rt-react

React Native bridge for Terra Realtime mobile SDKs

## Installation

```sh
npm install react-native-terra-rt-react
```

## Usage

To begin, please set up the environment as instructed by [TerraRTiOS](https://docs.tryterra.co/docs/stream-heart-rate-ios-sdk) and [TerraRTAndroid](https://docs.tryterra.co/docs/stream-heart-rate-android-sdk).

The functionalities form these SDKs have been bridged over so you may call them from react native. 

### Initialising TerraRT

This can be done using 

```ts
initTerra(
  devId: String,
  referenceId?: String
): Promise<SuccessMessage>
```

### Initialising a connection

```ts
initConnection(token: String): Promise<SuccessMessage>
```

### Getting the UserId
```ts
getUserId(): Promise<GetUserId>
```

### Start scanning for a device

On Android, you may use

```ts
startDeviceScan(
  connections: Connections,
  useCache: Boolean = false,
  showWidgetIfCacheNotFound: Boolean = false
): Promise<SuccessMessage> 
```
On iOS, the native view is bridged over to React Native as a component. You can get it as:

```ts
const BLWidget = requireNativeComponent('BLWidget');
```

And you may use it as a component:
```ts
<SafeAreaView style={styles.container}>
    {Platform.OS === 'ios' && displayWidget && (
    <BLWidget
        withCache={false}
        onSuccessfulConnection={_onSuccessfulConnection} // Function that is called when connection established
    />
    )}
</SafeAreaView>
```

In the case, it is displayed, it will automatically remove itself from view whe `_onSuccessfulConnection` is called.

### Start streaming

```ts
startRealtime(
  connections: Connections,
  dataTypes: Array<DataTypes>,
  token: String | null = null
): Promise<SuccessMessage>
```

In the case you wish to receive data in the app, this function also updates the app in an event listener. You may receive updates by listening for "Update" events:

```ts
const eventEmitter = new NativeEventEmitter(NativeModules.UpdateHandler);
    eventEmitter.addListener('Update', (event: Update) => {
        // Update view with event
    });
```

### Stop streaming

```ts
stopRealtime(
  connections: Connections
): Promise<SuccessMessage>
```

### Disconnecting from device

```ts
disconnect(connections: Connections): Promise<SuccessMessage>
```

### Connecting to WatchOS (iOS ONLY)
```ts
connectWithWatchOS(): Promise<SuccessMessage>
```

In the case you wish to use this, you will need to create a companion app for the current react native app in native Swift/ObjC. This is because react-native has yet to support WatchOS developement. `TerraRTiOS` supports WatchOS integration directly. 

## Types

Types used above can be seen here.

```ts
enum Connections {
  ANT = 'ANT',
  BLE = 'BLE',
  WEAR_OS = 'WEAR_OS',
  WATCH_OS = 'WATCH_OS',
  ANDROID = 'ANDROID',
  ALL_DEVICES = 'ALL_DEVICES',
  APPLE = 'APPLE',
}

enum DataTypes {
  HEART_RATE = 'HEART_RATE',
  ECG = 'ECG',
  STEPS = 'STEPS',
  HRV = 'HRV',
  CALORIES = 'CALORIES',
  LOCATION = 'LOCATION',
  DISTANCE = 'DISTANCE',
  ACTIVITY = 'ACTIVITY',
  ACCELERATION = 'ACCELERATION',
  GYROSCOPE = 'GYROSCOPE',
  FLOORS_CLIMBED = 'FLOORS_CLIMBED',
  STEPS_CADENCE = 'STEPS_CADENCE',
  SPEED = 'SPEED',
  POWER = 'POWER',
  BIKE_CADENCE = 'BIKE_CADENCE',
  MET = 'MET',
  RR_INTERVAL = 'RR_INTERVAL',
}

type GetUserId = {
  success: Boolean;
  userId: String | null;
};

type SuccessMessage = {
  success: Boolean;
  error: String | null;
};

type Update = {
  ts: String | null;
  val: number | null;
  type: String | null;
  d: Array<number> | null;
};

```

## Example

A very simple example project was generated here. This is used as internal testing and may providing a starting point for you if needed. Please fill in the `config` file with credentials to start.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
