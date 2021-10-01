/// <reference types="vite/client" />
/// <reference types="vue/ref-macros" />
declare module '*';

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module 'global' {
  import { session, ipcRenderer } from 'electron';
  global {
    interface Window {
      api: {
        session: typeof session;
        ipcRenderer: typeof ipcRenderer;
        platform: typeof process.platform;
      };
    }
  }
}
