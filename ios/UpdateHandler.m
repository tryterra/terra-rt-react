#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Foundation/Foundation.h>

@interface RCT_EXTERN_MODULE(UpdateHandler, RCTEventEmitter)

RCT_EXTERN_METHOD(supportedEvents)
RCT_EXTERN_METHOD(update:(NSDictionary *)update)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
