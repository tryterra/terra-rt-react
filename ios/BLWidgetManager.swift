//
//  BLWidgetManager.swift
//  TerraRtReact
//
//  Created by Elliott Yu on 19/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation
import TerraRTiOS
import SwiftUI
import UIKit


@available(iOS 13.0, *)
@objc(BLWidget)
class BLWidget: UIView{
    var connection_: Connections? = nil
    
    lazy var widgetView: TerraBLEWidget? = {
        guard let terraRT = TerraRtReact.terraRt else{
            return nil
        }
        return terraRT.startBluetoothScan(type: .BLE, bluetoothLowEnergyFromCache: self.withCache){success in
            if let successCallback = self.onSuccessfulConnection {
                successCallback(["success": success])
            }
            DispatchQueue.main.async {
                let viewController = UIApplication.shared.delegate?.window??.rootViewController
                viewController?.dismiss(animated: true)
            }
        }
    }()
    
    @objc var withCache: Bool = false
    
    @objc var onSuccessfulConnection: RCTDirectEventBlock?
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        setupView()
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    func embeddedView() -> UIView{
        return UIHostingController(rootView: widgetView).view!
    }
    
    func setupView(){
        let uiHost = UIHostingController(rootView: widgetView)
        let viewController = UIApplication.shared.delegate?.window??.rootViewController
        viewController?.present(uiHost, animated: true)
    }
}

@available(iOS 13.0, *)
@objc(BLWidgetManager)
class BLWidgetManager: RCTViewManager {
    
    override func view() -> UIView!{
        return BLWidget()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
