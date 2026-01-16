import Foundation
import TerraRTiOS

@objc(TerraRtReact)
class TerraRtReact: NSObject {
    
    public static var terraRt: TerraRT? = nil
    private static var scannedDevices: [String: Device] = [:]
        
    static func parseConnections(_ connections: String) -> Connections?{
        switch connections{
        case "BLE":
            return .BLE
        case "WATCH_OS":
            return .WATCH_OS
        case "APPLE":
            return .APPLE
        default:
            return nil
        }
    }
    
    static func parseDataTypes(_ dataTypes: String) -> DataTypes?{
        switch dataTypes{
        case "HEART_RATE":
            return .HEART_RATE
        case "ECG":
            return .ECG
        case "STEPS":
            return .STEPS
        case "HRV":
            return .HRV
        case "CALORIES":
            return .CALORIES
        case "LOCATION":
            return .LOCATION
        case "SPEED":
            return .SPEED
        case "DISTANCE":
            return .DISTANCE
        case "STEPS_CADENCE":
            return .STEPS_CADENCE
        case "FLOORS_CLIMBED":
            return .FLOORS_CLIMBED
        case "GYROSCOPE":
            return .GYROSCOPE
        case "ACCELERATION":
            return .ACCELERATION
        default:
            return nil
        }
    }
    
    private func _updateCallback_(_ update: Update){
        let update_: [String: Any?] = ["ts": update.ts, "val": update.val, "type": update.type, "d": update.d]
        (UpdateHandler.emitter as! UpdateHandler).update(update_ as NSDictionary)
    }

    private func _deviceCallback_(_ device: Device){
        let device_: [String: String?] = ["name": device.deviceName, "id": device.deviceUUID, "type": "BLE"]
        TerraRtReact.scannedDevices[device.deviceUUID] = device
        (DeviceHandler.emitter as! DeviceHandler).update(device_ as NSDictionary)
    }

    private func _connectionCallback_(_ update: Bool){
        print(update)
        (ConnectionHandler.emitter as! ConnectionHandler).update(update)
    }
    
    @objc(initTerra:withReferenceId:withResolver:withRejecter:)
    func initTerra(devId: String, referenceId: String, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        TerraRtReact.terraRt = TerraRT(devId: devId, referenceId: referenceId){success in
            resolve(["success": success])
        }
    }

    @objc(initConnection:withResolver:withRejecter:)
    func initConnection(token: String, resolve: @escaping  RCTPromiseResolveBlock,reject: RCTPromiseRejectBlock) -> Void{
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        terraRT.initConnection(token: token){success in
            resolve(["success": success])
        }
    }

    @objc(getUserId:withRejecter:)
    func getUserId(resolve: @escaping  RCTPromiseResolveBlock,reject: RCTPromiseRejectBlock) -> Void{
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        resolve(["success": true, "userId": terraRT.getUserid()])
    }

    @objc(startDeviceScan:withUseCache:withshowWidgetIfCacheNotFound:withResolver:withRejecter:)
    func startDeviceScan(connections: String, withCache: Bool, showWidgetIfCacheNotFound: Bool, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(["success": false, "error": "For iOS, the scanner is embedded as a native view! You can use `requireNativeView('BLWidget') for the view."])
    }
    
    @objc(startRealtime:withDataTypes:withToken:withResolver:withRejecter:)
    func startRealtime(connections: String, dataTypes: [String], token: String, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        guard let connection = TerraRtReact.parseConnections(connections) else{
            resolve(["success": false, "error": "Invalid Connection"])
            return
        }
        
        var dataTypes_: Set<DataTypes> = Set([])
        for dataType in dataTypes {
            if let dType_ = TerraRtReact.parseDataTypes(dataType){
                dataTypes_.insert(dType_)
            }
        }
        
        terraRT.startRealtime(type: connection, dataType: dataTypes_, token: token, callback: _updateCallback_, connectionCallback: _connectionCallback_)
        resolve(["success": true])   
    }

    @objc(stopRealtime:withResolver:withRejecter:)
    func stopRealtime(connections: String, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        guard let connection = TerraRtReact.parseConnections(connections) else{
            resolve(["success": false, "error": "Invalid Connection"])
            return
        }
        
        terraRT.stopRealtime(type: connection)
        resolve(["success": true])
    }

    @objc(startBluetoothScan:withResolver:withRejecter:)
    func startBluetoothScan(connections: String, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        guard let connection = TerraRtReact.parseConnections(connections) else{
            resolve(["success": false, "error": "Invalid Connection"])
            return
        }
        TerraRtReact.scannedDevices = [:]
        terraRT.startBluetoothScan(type: connection, deviceCallback: _deviceCallback_)
        resolve(["success": true])
    }
    
    @objc(connectDevice:withResolver:withRejecter:)
    func connectDevice(device: String, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        if let device_ = TerraRtReact.scannedDevices[device]{
            terraRT.connectDevice(device_){success in
                resolve(["success": success])
            }
        }
        else{
            resolve(["success": false, "error": "Device not found"])
        }
    }


    @objc(disconnect:withResolver:withRejecter:)
    func disconnect(connections: String, resolve: @escaping RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void{
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        
        guard let connection = TerraRtReact.parseConnections(connections) else{
            resolve(["success": false, "error": "Invalid Connection"])
            return
        }
        
        terraRT.disconnect(type: connection)
        resolve(["success": true])
    }
    
    @objc(connectWithWatchOS:withRejecter:)
    func connectWithWatchOS(resolve: @escaping  RCTPromiseResolveBlock,reject: RCTPromiseRejectBlock) -> Void{
        guard let terraRT = TerraRtReact.terraRt else{
            resolve(["success": false, "error": "Please initialise a terra class by using `initTerra` first"])
            return
        }
        do {
            try terraRT.connectWithWatchOS()
            resolve(["success": true])
        }
        catch{
            resolve(["success": false, "error": error.localizedDescription])
        }
    }
}
