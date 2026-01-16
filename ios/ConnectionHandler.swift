//
//  ConnectionHandler.swift
//  TerraRtReact
//
//  Created by Elliott Yu on 19/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

@objc(ConnectionHandler)
open class ConnectionHandler: RCTEventEmitter{
    @objc public static var emitter: RCTEventEmitter!
    
    override init(){
        super.init()
        ConnectionHandler.emitter = self
    }

  @objc open func update(_ connection: Bool) {
        sendEvent(withName: "ConnectionUpdate", body: connection)
    }
    
    open override func supportedEvents() -> [String]! {
      return ["ConnectionUpdate"]
    }
}
