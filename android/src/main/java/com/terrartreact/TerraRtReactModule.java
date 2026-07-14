package com.terrartreact;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.ReadableArray;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;
import co.tryterra.terrartandroid.enums.Connections;
import co.tryterra.terrartandroid.enums.DataTypes;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import co.tryterra.terrartandroid.*;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Objects;

import co.tryterra.terrartandroid.models.Update;
import kotlin.Unit;

@ReactModule(name = TerraRtReactModule.NAME)
public class TerraRtReactModule extends ReactContextBaseJavaModule {
  public static final String NAME = "TerraRtReact";
  private static HashMap<String, Device> devices = new HashMap<>();

  public final ReactApplicationContext reactContext;
  public TerraRtReactModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }


  private void sendEvent(ReactApplicationContext reactContext,
                      String eventName,
                      Object params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  public TerraRT terraRt;

  private DataTypes parseDataType(String dataType){
    switch (dataType){
        case "HEART_RATE":
          return DataTypes.HEART_RATE;
        case "ECG":
          return DataTypes.ECG;
        case "STEPS":
          return DataTypes.STEPS;
        case "HRV":
          return DataTypes.HRV;
        case "CALORIES":
          return DataTypes.CALORIES;
        case "LOCATION":
          return DataTypes.LOCATION;
        case "DISTANCE":
          return DataTypes.DISTANCE;
        case "ACTIVITY":
          return DataTypes.ACTIVITY;
        case "ACCELERATION":
          return DataTypes.ACCELERATION;
        case "GYROSCOPE":
          return DataTypes.GYROSCOPE;
        case "FLOORS_CLIMBED":
          return DataTypes.FLOORS_CLIMBED;
        case "STEPS_CADENCE":
          return DataTypes.STEPS_CADENCE;
        case "SPEED":
          return DataTypes.SPEED;
        case "POWER":
          return DataTypes.POWER;
        case "BIKE_CADENCE":
          return DataTypes.BIKE_CADENCE;
        case "MET":
          return DataTypes.MET;
        case "RR_INTERVAL":
          return DataTypes.RR_INTERVAL;
        default:
          return null;
    }
  }

  private Connections parseConnection(String connection){
    switch (connection){
      case "BLE":
        return Connections.BLE;
      case "ANT":
        return Connections.ANT;
      case "ALL_DEVICES":
        return Connections.ALL_DEVICES;
      case "WEAR_OS":
        return Connections.WEAR_OS;
      case "ANDROID":
        return Connections.ANDROID;
      default:
        return null;
    }
  }

  private Unit _updateHandler_(Update update){
    // Follows the structure:

    // var ts: String? = null,
    // var `val`: Double? = null,
    // var type: String? = null,
    // var d: ArrayList<Double>? = null

    WritableMap map = new WritableNativeMap();
    if (update.getD() == null) {
      map.putNull("d");
    } else {
      WritableArray arr = new WritableNativeArray();
      for (Double d_ : update.getD()) arr.pushDouble(d_);
      map.putArray("d", arr);
    }

    map.putString("ts", update.getTs());
    map.putDouble("val", update.getVal() == null ? 0.0 : update.getVal());
    map.putString("type", update.getType());
    sendEvent(this.reactContext, "Update", map);

    return Unit.INSTANCE;
  }

  private Unit _connectionCallback_(boolean success){
    sendEvent(this.reactContext, "ConnectionUpdate", success);
    return Unit.INSTANCE;
  }

  private Unit _deviceHandler_(Device device){
    // Follows the structure:

    // val deviceId: String,
    // val deviceName: String?,

    WritableMap map = new WritableNativeMap();

    map.putString("id", device.getDeviceId());
    map.putString("name", device.getDeviceName());
    map.putString("type", "BLE");
    sendEvent(this.reactContext, "Device", map);
    devices.put(device.getDeviceId(), device);
    return Unit.INSTANCE;
  }

  @ReactMethod
  public void initTerra(String devId, String referenceId, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.getCurrentActivity() == null){
      map.putBoolean("success", false);
      map.putString("error", "Unable to resolve current activity");
      promise.resolve(map);
      return;
    }

    this.terraRt = new TerraRT(devId, Objects.requireNonNull(this.getCurrentActivity()), referenceId, (success) -> {
      map.putBoolean("success", success);
      promise.resolve(map);
      return Unit.INSTANCE;
    });
  }

  @ReactMethod
  public void initConnection(String token, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }

    if (token == null){
      map.putBoolean("success", false);
      map.putString("error", "Invalid token");
      promise.resolve(map);
      return;
    }

    this.terraRt.initConnection(token, (success) -> {
      map.putBoolean("success", success);
      promise.resolve(map);
      return Unit.INSTANCE;
    });
  }

  @ReactMethod
  public void getUserId(Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }
    map.putBoolean("success", true);
    map.putString("userId", this.terraRt.getUserId());
    promise.resolve(map);
  }

  @ReactMethod
  public void startDeviceScan(String connections, boolean useCache, boolean showWidgetIfCacheNotFound, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.parseConnection(connections) == null){
      map.putBoolean("success", false);
      map.putString("error", "Invalid connections type");
      promise.resolve(map);
      return;
    }

    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }

    this.terraRt.startDeviceScan(Objects.requireNonNull(this.parseConnection(connections)), useCache, showWidgetIfCacheNotFound, (success) -> {
      map.putBoolean("success", success);
      promise.resolve(map);
      return Unit.INSTANCE;
    });
  }

  @ReactMethod
  public void startRealtime(String connections, ReadableArray dataTypes, String token, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.parseConnection(connections) == null){
      map.putBoolean("success", false);
      map.putString("error", "Invalid connections type");
      promise.resolve(map);
      return;
    }

    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }
    HashSet<DataTypes> dataTypes_ = new HashSet<>();
    for (Object dType: dataTypes.toArrayList()){
        if (dType == null || this.parseDataType((String) dType) == null){
            continue;
        }
        dataTypes_.add(this.parseDataType((String) dType));
    }

    this.terraRt.startRealtime(Objects.requireNonNull(this.parseConnection(connections)), dataTypes_, token, this::_updateHandler_, this::_connectionCallback_);
    map.putBoolean("success", true);
    promise.resolve(map);
  }

  @ReactMethod
  public void stopRealtime(String connections, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.parseConnection(connections) == null){
      map.putBoolean("success", false);
      map.putString("error", "Invalid connections type");
      promise.resolve(map);
      return;
    }

    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }

    this.terraRt.stopRealtime(Objects.requireNonNull(this.parseConnection(connections)));
    map.putBoolean("success", true);
    promise.resolve(map);
  }

  @ReactMethod
  public void disconnect(String connections, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.parseConnection(connections) == null){
      map.putBoolean("success", false);
      map.putString("error", "Invalid connections type");
      promise.resolve(map);
      return;
    }

    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }

    this.terraRt.disconnect(Objects.requireNonNull(this.parseConnection(connections)));
    map.putBoolean("success", true);
    promise.resolve(map);
  }

  @ReactMethod
  public void connectWithWatchOS(Promise promise){
    promise.reject("Unimplemented function for Android");
  }

  @ReactMethod
  public void startDeviceScanWithCallback(String connections, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.parseConnection(connections) == null){
      map.putBoolean("success", false);
      map.putString("error", "Invalid connections type");
      promise.resolve(map);
      return;
    }

    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }

    this.terraRt.startDeviceScan(Objects.requireNonNull(this.parseConnection(connections)), this::_deviceHandler_);
  }

  @ReactMethod
  public void connectDevice(String deviceId, Promise promise){
    WritableMap map = new WritableNativeMap();

    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }
    if (!devices.containsKey(deviceId)){
      map.putBoolean("success", false);
      map.putString("error", "Device not found");
      promise.resolve(map);
      return;
    }
    
    // The SDK reuses this callback for later connection updates
    // (e.g. disconnect) — a promise must resolve exactly once.
    final java.util.concurrent.atomic.AtomicBoolean resolved =
        new java.util.concurrent.atomic.AtomicBoolean(false);
    this.terraRt.connectDevice(devices.get(deviceId), (success) -> {
      if (resolved.compareAndSet(false, true)) {
        map.putBoolean("success", success);
        promise.resolve(map);
      }
      return Unit.INSTANCE;
    });
  }

  /**
   * Customizes the persistent notification and (re)starts the streaming
   * foreground service. As of terra-rtandroid 0.4.12 the service lifecycle
   * is managed by the SDK (startRealtime starts it, stopRealtime/disconnect
   * stop it) — calling this is only needed to override the notification.
   */
  @ReactMethod
  public void startForegroundService(String title, String text, Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }
    this.terraRt.startForegroundService(title, text, null);
    map.putBoolean("success", true);
    promise.resolve(map);
  }

  /** Stops the streaming foreground service (managed automatically by the SDK). */
  @ReactMethod
  public void stopForegroundService(Promise promise){
    WritableMap map = new WritableNativeMap();
    if (this.terraRt == null){
      map.putBoolean("success", false);
      map.putString("error", "Please initialise a terra class by using `initTerra` first");
      promise.resolve(map);
      return;
    }
    this.terraRt.stopForegroundService();
    map.putBoolean("success", true);
    promise.resolve(map);
  }

  /** Whether the app is exempt from battery optimizations (aggressive OEMs kill streams otherwise). */
  @ReactMethod
  public void isIgnoringBatteryOptimizations(Promise promise){
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M) {
      promise.resolve(true); // no battery optimizations before API 23
      return;
    }
    PowerManager pm = (PowerManager) this.reactContext.getSystemService(Context.POWER_SERVICE);
    promise.resolve(pm != null && pm.isIgnoringBatteryOptimizations(this.reactContext.getPackageName()));
  }

  /** Opens the system dialog requesting a battery-optimization exemption. */
  @ReactMethod
  public void requestIgnoreBatteryOptimizations(Promise promise){
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M) {
      promise.resolve(true); // no battery optimizations before API 23
      return;
    }
    try {
      Intent intent = new Intent(
          Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:" + this.reactContext.getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      this.reactContext.startActivity(intent);
      promise.resolve(true);
    } catch (Exception e) {
      promise.resolve(false);
    }
  }
}

