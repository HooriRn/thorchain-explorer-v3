import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NetworkData {
  [key: string]: any;
}

interface NodesData {
  [key: string]: any;
}

interface ChainsHeight {
  [key: string]: any;
}

interface Pools {
  [key: string]: any;
}

type ThemeType = "light" | "dark" | "system" | "BlueElectra";

interface AppState {
  runePrice: number;
  showMenu: boolean;
  networkData: NetworkData | undefined;
  nodesData: NodesData | undefined;
  chainsHeight: ChainsHeight | undefined;
  fullscreen: boolean;
  showSidebar: boolean;
  pools: Pools | undefined;
  extraHeaderInfo: any[];
  theme: ThemeType;

  setRunePrice: (price: number) => void;
  setNetworkData: (networkData: NetworkData) => void;
  setNodesData: (nodesData: NodesData) => void;
  toggleMenu: (action?: boolean) => void;
  toggleFullscreen: () => void;
  setSidebar: (action: boolean) => void;
  setChainsHeight: (action: ChainsHeight) => void;
  setPools: (action: Pools) => void;
  setExtraHeaderInfo: (values: any[]) => void;
  resetExtraHeaderInfo: () => void;
  setTheme: (theme: ThemeType) => void;

  getRunePrice: () => number;
  getIsMenuOn: () => boolean;
  getNetworkData: () => NetworkData | undefined;
  getNodesData: () => NodesData | undefined;
  getFullScreen: () => boolean;
  getSidebar: () => boolean;
  getChainsHeight: () => ChainsHeight | undefined;
  getPools: () => Pools | undefined;
  getExtraHeaderInfo: () => any[];
  getTheme: () => ThemeType;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      runePrice: 0,
      showMenu: false,
      networkData: undefined,
      nodesData: undefined,
      chainsHeight: undefined,
      fullscreen: false,
      showSidebar: false,
      pools: undefined,
      extraHeaderInfo: [],
      theme: "system",

      setRunePrice: (price) => set({ runePrice: price }),

      setNetworkData: (networkData) => set({ networkData }),

      setNodesData: (nodesData) => set({ nodesData }),

      toggleMenu: (action) => {
        const currentShowMenu = get().showMenu;
        set({ showMenu: action !== undefined ? action : !currentShowMenu });
      },

      toggleFullscreen: () => {
        const currentFullscreen = get().fullscreen;
        set({ fullscreen: !currentFullscreen });
      },

      setSidebar: (action) => set({ showSidebar: action }),

      setChainsHeight: (action) => set({ chainsHeight: action }),

      setPools: (action) => set({ pools: action }),

      setExtraHeaderInfo: (values) => set({ extraHeaderInfo: values }),

      resetExtraHeaderInfo: () => set({ extraHeaderInfo: [] }),

      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== "undefined") {
          if (theme === "BlueElectra") {
            document.documentElement.setAttribute("theme", "BlueElectra");
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "BlueElectra");
          } else {
            document.documentElement.removeAttribute("theme");
            localStorage.removeItem("theme");
            if (theme === "dark") {
              document.documentElement.classList.add("dark");
            } else if (theme === "light") {
              document.documentElement.classList.remove("dark");
            }
          }
        }
      },

      getRunePrice: () => get().runePrice ?? 0,

      getIsMenuOn: () => get().showMenu,

      getNetworkData: () => get().networkData,

      getNodesData: () => get().nodesData,

      getFullScreen: () => get().fullscreen,

      getSidebar: () => get().showSidebar,

      getChainsHeight: () => get().chainsHeight,

      getPools: () => get().pools,

      getTheme: () => get().theme,

      getExtraHeaderInfo: () => get().extraHeaderInfo,
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        showSidebar: state.showSidebar,
        theme: state.theme,
      }),
    }
  )
);

export const useRunePrice = () => useAppStore((state) => state.runePrice);
export const useIsMenuOn = () => useAppStore((state) => state.getIsMenuOn());
export const useNetworkData = () =>
  useAppStore((state) => state.getNetworkData());
export const useNodesData = () => useAppStore((state) => state.getNodesData());
export const useFullScreen = () =>
  useAppStore((state) => state.getFullScreen());
export const useSidebar = () => useAppStore((state) => state.getSidebar());
export const useChainsHeight = () =>
  useAppStore((state) => state.getChainsHeight());
export const usePools = () => useAppStore((state) => state.getPools());
export const useExtraHeaderInfo = () =>
  useAppStore((state) => state.getExtraHeaderInfo());
export const useTheme = () => useAppStore((state) => state.getTheme());

export const useSetRunePrice = () => useAppStore((state) => state.setRunePrice);
export const useSetNetworkData = () =>
  useAppStore((state) => state.setNetworkData);
export const useSetNodesData = () => useAppStore((state) => state.setNodesData);
export const useToggleMenu = () => useAppStore((state) => state.toggleMenu);
export const useToggleFullscreen = () =>
  useAppStore((state) => state.toggleFullscreen);
export const useSetSidebar = () => useAppStore((state) => state.setSidebar);
export const useSetChainsHeight = () =>
  useAppStore((state) => state.setChainsHeight);
export const useSetPools = () => useAppStore((state) => state.setPools);
export const useSetExtraHeaderInfo = () =>
  useAppStore((state) => state.setExtraHeaderInfo);
export const useResetExtraHeaderInfo = () =>
  useAppStore((state) => state.resetExtraHeaderInfo);
export const useSetTheme = () => useAppStore((state) => state.setTheme);

export const useAppActions = () => {
  const setRunePrice = useSetRunePrice();
  const setNetworkData = useSetNetworkData();
  const setNodesData = useSetNodesData();
  const toggleMenu = useToggleMenu();
  const toggleFullscreen = useToggleFullscreen();
  const setSidebar = useSetSidebar();
  const setChainsHeight = useSetChainsHeight();
  const setPools = useSetPools();
  const setExtraHeaderInfo = useSetExtraHeaderInfo();
  const resetExtraHeaderInfo = useResetExtraHeaderInfo();
  const setTheme = useSetTheme();

  return {
    setRunePrice,
    setNetworkData,
    setNodesData,
    toggleMenu,
    toggleFullscreen,
    setSidebar,
    setChainsHeight,
    setPools,
    setExtraHeaderInfo,
    resetExtraHeaderInfo,
    setTheme,
  };
};

export const useStore = () => {
  const runePrice = useRunePrice();
  const menu = useIsMenuOn();
  const networkData = useNetworkData();
  const nodesData = useNodesData();
  const fullscreen = useFullScreen();
  const sidebar = useSidebar();
  const chainsHeight = useChainsHeight();
  const pools = usePools();
  const extraHeaderInfo = useExtraHeaderInfo();
  const theme = useTheme();

  const setRunePrice = useSetRunePrice();
  const setNetworkData = useSetNetworkData();
  const setNodesData = useSetNodesData();
  const toggleMenu = useToggleMenu();
  const toggleFullscreen = useToggleFullscreen();
  const setSidebar = useSetSidebar();
  const setChainsHeight = useSetChainsHeight();
  const setPools = useSetPools();
  const setExtraHeaderInfo = useSetExtraHeaderInfo();
  const resetExtraHeaderInfo = useResetExtraHeaderInfo();
  const setTheme = useSetTheme();

  return {
    runePrice,
    menu,
    networkData,
    nodesData,
    fullscreen,
    sidebar,
    chainsHeight,
    pools,
    extraHeaderInfo,
    theme,

    setRunePrice,
    setNetworkData,
    setNodesData,
    toggleMenu,
    toggleFullscreen,
    setSidebar,
    setChainsHeight,
    setPools,
    setExtraHeaderInfo,
    resetExtraHeaderInfo,
    setTheme,
  };
};
