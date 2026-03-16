declare const window: any;

export const environment = {
  production: true,
  apiUrl:
    typeof window !== 'undefined' && window.__env?.API_URL
      ? window.__env.API_URL
      : 'http://localhost:3000/api',
};
