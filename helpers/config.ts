export interface EnvConfig {
  vcoreBaseUrl?: string;
  socketBaseUrl?: string;
  appId?: string;
}

export const vkycTpcConfig = {
  vcoreBaseUrl: "https://vekyc-gateway-server-uat.mobifi.vn",
  socketBaseUrl: "https://vekyc-vekyc-service-uat.mobifi.vn",
  appId: "b2d320ca642f48958f2b5e5cd1b1c547",
};

export enum MessageCode {
  SUCCESS = 'SUCCESS',
  END_CALL = 'END_CALL',
  END_CALL_EARLY = 'END_CALL_EARLY',
  CALL_EXPIRED = 'CALL_EXPIRED',
  CALL_TIMEOUT = 'CALL_TIMEOUT',
  ERROR_INIT = 'ERROR_INIT',
  ERROR_HOOK = 'ERROR_HOOK',
  ERROR_CLOSE_VIDEO = 'ERROR_CLOSE_VIDEO',
  ERROR = 'ERROR',
};
