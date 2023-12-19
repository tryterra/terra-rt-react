//
//  DeviceHandler.swift
//  TerraRtReact
//
//  Created by Elliott Yu on 19/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

@objc(DeviceHandler)
open class DeviceHandler: RCTEventEmitter{
    @objc public static var emitter: RCTEventEmitter!
    
    override init(){
        super.init()
        DeviceHandler.emitter = self
    }

    @objc open func update(_ device: NSDictionary) {
        sendEvent(withName: "Device", body: device)
    }
    
    open override func supportedEvents() -> [String]! {
      return ["Device"]
    }
}
