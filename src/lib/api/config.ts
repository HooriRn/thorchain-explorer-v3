export const API_ENDPOINTS = {
  mainnet: {
    MIDGARD_BASE_URL: "https://midgard.ninerealms.com/v2/",
    MIDGARD_GRAPH_QL: "https://midgard.ninerealms.com/v2",
    ARCHIVE_THORNODE: "https://thornode-v1.ninerealms.com/",
    THORNODE_URL: "https://thornode.ninerealms.com/",
    TENDERMINT_URL: "https://rpc.ninerealms.com/",
    SERVER_URL: "https://vanaheimex.com/",
    MODULE_ADDR: "thor1dheycdevq39qlkxs2a6wuuzyn4aqxhve4qxtxt",
  },
  stagenet: {
    MIDGARD_BASE_URL: "https://stagenet-midgard.ninerealms.com/v2/",
    MIDGARD_GRAPH_QL: "https://stagenet-midgard.ninerealms.com/v2",
    ARCHIVE_THORNODE: "https://stagenet-thornode.ninerealms.com/",
    THORNODE_URL: "https://stagenet-thornode.ninerealms.com/",
    TENDERMINT_URL: "https://stagenet-rpc.ninerealms.com/",
    SERVER_URL: "https://vanaheimex.com/stage/",
    MODULE_ADDR: "sthor1dheycdevq39qlkxs2a6wuuzyn4aqxhvepe6as4",
  },
} as const;

export type NetworkType = keyof typeof API_ENDPOINTS;

export const getNetworkConfig = (network: NetworkType = "mainnet") => {
  return API_ENDPOINTS[network];
};

export const getCurrentNetwork = (): NetworkType => {
  return (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || "mainnet";
};
