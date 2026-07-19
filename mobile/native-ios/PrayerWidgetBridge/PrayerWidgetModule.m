#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PrayerWidget, NSObject)

RCT_EXTERN_METHOD(setPayload:(NSString *)json)
RCT_EXTERN_METHOD(setQiblaHeading:(nonnull NSNumber *)heading)
RCT_EXTERN_METHOD(scheduleFullScreenAzanAlarms:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(cancelFullScreenAzanAlarms)
RCT_EXTERN_METHOD(getFullScreenAzanAlarmDiagnostics:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(scheduleTestAzanAlarm:(nonnull NSNumber *)delaySeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(playNativeAzanAudio:(NSString *)soundId)
RCT_EXTERN_METHOD(stopNativeAzanAudio)
RCT_EXTERN_METHOD(playNativeAzanDuaAudio)
RCT_EXTERN_METHOD(getNativeAzanPlaybackStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getPendingAzanLaunch:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clearPendingAzanLaunch)
RCT_EXTERN_METHOD(finishAzanDelivery)
RCT_EXTERN_METHOD(isAzanSessionActive:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(requestAlarmKitAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setWindowSecure:(nonnull NSNumber *)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getDeviceIntegrityReport:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(verifyPinnedHttpsHost:(NSString *)host
                  pinsJson:(NSString *)pinsJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
