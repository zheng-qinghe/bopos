import Constants from 'expo-constants';

const runtimeUrl =
  Constants.expoConfig?.extra?.boposServerUrl ||
  Constants.manifest?.extra?.boposServerUrl ||
  process.env.BOPOS_SERVER_URL;

export const BASE_URL = runtimeUrl || 'http://localhost:3000';
