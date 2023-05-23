//
//  BLWidgetManager.m
//  TerraRtReact
//
//  Created by Elliott Yu on 19/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTViewManager.h>
#import <Foundation/Foundation.h>

@interface RCT_EXTERN_MODULE(BLWidgetManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(withCache, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onSuccessfulConnection, RCTDirectEventBlock)

@end
