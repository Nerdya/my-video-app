export interface EnvConfig {
  vpageBaseUrl: string;
  vcoreBaseUrl: string;
  appId: string;
}

export const vkycTpcConfig = {
  vpageBaseUrl: "https://vekyc-vpage-tpc-ui-uat.mobifi.vn",
  vcoreBaseUrl: "https://vekyc-gateway-server-uat.mobifi.vn",
  socketBaseUrl: "https://vekyc-vekyc-service-uat.mobifi.vn",
  socketHealthCheck: 3000,
  appId: "b2d320ca642f48958f2b5e5cd1b1c547",
};

export enum MessageCode {
  SUCCESS = 'SUCCESS',
  FORCE_DISCONNECT = 'FORCE_DISCONNECT',
  ERROR_INIT = 'ERROR_INIT',
  ERROR_HOOK = 'ERROR_HOOK',
  ERROR_CLOSE_VIDEO = 'ERROR_CLOSE_VIDEO',
  ERROR = 'ERROR',
};
