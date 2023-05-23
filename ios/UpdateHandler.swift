//
//  UpdateHandler.swift
//  TerraRtReact
//
//  Created by Elliott Yu on 19/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

@objc(UpdateHandler)
open class UpdateHandler: RCTEventEmitter{
    @objc public static var emitter: RCTEventEmitter!
    
    override init(){
        super.init()
        UpdateHandler.emitter = self
    }

    @objc open func update(_ update: NSDictionary) {
        sendEvent(withName: "Update", body: update)
    }
    
    open override func supportedEvents() -> [String]! {
      return ["Update"]
    }
}
