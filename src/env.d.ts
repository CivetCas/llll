/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module 'global' {
  import type { Session, IpcRenderer, Cookie, CookiesGetFilter } from 'electron';
  global {
    type Theme = 'black' | 'white' | 'infinite_grid' | 'gridient';
    interface Window {
      api: {
        setZoomLevel: (level: number) => void;
        updateTheme: (theme: any) => void;
        getCookie: (request: CookiesGetFilter) => Promise<Cookie[]>;
        setCookie: (cookie: Cookie) => Promise<void>;
        removeCookie: (url: string, name: string) => void;
        sendLyric: (params: any) => void;
        sendTrackPlayingNow: (params: any) => void;
        chooseLocalFile: (params: any) => void;
        session: Session;
        ipcRenderer: IpcRenderer;
        platform: NodeJS.Platform;
        sendControl: any;
        onLyricWindow: any;
        ipcOn: any;
        ipcOnce: any;
        readTag: (fp: string) => Promise<any>;
      };
    }
  }
}
