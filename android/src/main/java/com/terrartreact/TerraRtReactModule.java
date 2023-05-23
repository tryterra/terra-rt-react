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
import co.tryterra.terrartandroid.enums.Connections;
import co.tryterra.terrartandroid.enums.DataTypes;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import co.tryterra.terrartandroid.*;
import java.util.HashSet;
import java.util.Objects;

import co.tryterra.terrartandroid.models.Update;
import kotlin.Unit;

@ReactModule(name = TerraRtReactModule.NAME)
public class TerraRtReactModule extends ReactContextBaseJavaModule {
  public static final String NAME = "TerraRtReact";
  public final ReactApplicationContext reactContext;
  public TerraRtReactModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }


  private void sendEvent(ReactApplicationContext reactContext,
                      String eventName,
                      WritableMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  public static Callback _updateHandler = null;
  public static Callback _connectionCallback = null;

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
    if (update.getD() == null){
      map.putArray("d", null);
    }
    else{
      WritableArray arr = new WritableNativeArray();
      for (Double d_: update.getD()){
        arr.pushDouble(d_);
      }
      map.putArray("d", arr);
    }

    map.putString("ts", update.getTs());
    map.putDouble("val", update.getVal() == null ? 0.0 : update.getVal());
    map.putString("type", update.getType());
    sendEvent(this.reactContext, "Update", map);

    return Unit.INSTANCE;
  }

  private Unit _connectionCallback_(boolean success){
    if (_connectionCallback == null){
      return Unit.INSTANCE;
    }

    _connectionCallback.invoke(success);
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

    this.terraRt.startRealtime(Objects.requireNonNull(this.parseConnection(connections)), dataTypes_, token, this::_updateHandler_, (success) -> {
      map.putBoolean("success", success);
      promise.resolve(map);
    });
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
}

