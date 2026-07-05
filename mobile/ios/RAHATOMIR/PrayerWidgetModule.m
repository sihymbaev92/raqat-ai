#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PrayerWidget, NSObject)

RCT_EXTERN_METHOD(setPayload:(NSString *)json)
RCT_EXTERN_METHOD(setQiblaHeading:(nonnull NSNumber *)heading)

@end
