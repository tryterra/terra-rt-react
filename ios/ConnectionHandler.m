//
//  ConnectionHandler.h
//  TerraRtReact
//
//  Created by Elliott Yu on 16/01/2026.
//  Copyright © 2026 Facebook. All rights reserved.
//


#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Foundation/Foundation.h>

@interface RCT_EXTERN_MODULE(ConnectionHandler, RCTEventEmitter)

RCT_EXTERN_METHOD(supportedEvents)
RCT_EXTERN_METHOD(update:(BOOL)update)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
