"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { rcompare } from 'semver';
import { orderBy, countBy } from 'lodash';
import moment from 'moment';
import NodeTable from './component/NodeTable';
import { fillNodeData, availableChains, blockTime } from '@/utils/index';
import SearchIcon from '@/assets/images/search.svg';
import Caret from '@/assets/images/caret.svg';
import TableLoader from '@/components/TableLoader';
import Page from '@/components/PageContainer';
import Card from '@/components/ui/Card';
import InfoCard from '@/components/InfoCard';
import { useChainsHeight, useRunePrice } from '@/lib/store';
import styles from './index.module.css';

const NodesPage: React.FC = () => {
  const [network, setNetwork] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [nodesQuery, setNodesQuery] = useState<any>(undefined);
  const [minBond, setMinBond] = useState(30000000000000); 
  const [extraNodeChurn, setExtraNodeChurn] = useState(0);
  const [newNodesChurn, setNewNodesChurn] = useState(2);
  const [churnInterval, setChurnInterval] = useState<any>(undefined);
  const [bondMetrics, setBondMetrics] = useState<any>(undefined);
  const [mimirs, setMimirs] = useState<any>(undefined);
  const [intervalId, setIntervalId] = useState<any>(undefined);
  const [secondInterval, setSecondInterval] = useState<any>(undefined);
  const [churnHalted, setChurnHalted] = useState<any>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [churnProgressValue, setChurnProgressValue] = useState(0);
  const [totalAwards, setTotalAwards] = useState<any>(undefined);
  const [leastBondChurn, setLeastBondChurn] = useState(0);
  const [retiringVaults, setRetiringVaults] = useState<any[]>([]);
  const [enteringBond, setEnteringBond] = useState(0);
  const [enteringCount, setEnteringCount] = useState(0);
  const [leavingBond, setLeavingBond] = useState(0);
  const [leavingCount, setLeavingCount] = useState(0);
  const [hides, setHides] = useState({
    isp: false,
    score: true,
    fee: false,
    age: false,
    RPC: true,
    BFR: true,
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>(null);
  const [churn, setChurn] = useState<any>(undefined);
  const [churnProgressTime, setChurnProgressTime] = useState<any>(undefined);

  const runePrice = useRunePrice();
  const chainsHeight = useChainsHeight();

  const error = useMemo(() => !nodesQuery, [nodesQuery]);

  const getRetiringVault = useCallback((vaults: any[]) => {
    return vaults
      .filter((v) => v.status === 'RetiringVault')
      .map((v) => v.membership)
      .flat();
  }, []);

  const getNodeOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/network');
      const { data } = await response.json();

      if (data) {
        const { network: networkData, churn: churnData, blockRewards } = data;

        setNetwork(networkData);
        setBondMetrics(networkData.bondMetrics);
        setChurn(churnData);
        setChurnHalted(blockRewards?.HALTCHURNING);
        setMinBond(+(blockRewards?.MINIMUMBONDINRUNE || minBond));
        setChurnInterval(+(blockRewards?.CHURNINTERVAL || 0));
        setNewNodesChurn(+(blockRewards?.NUMBEROFNEWNODESPERCHURN || 2));
      }
    } catch (e) {
      console.error(e);
    }
  }, [minBond]);

  const updateNodes = useCallback(async () => {
    try {
      const response = await fetch('/api/nodes');
      const { data: nodesInfo } = await response.json();
      setNodesQuery(nodesInfo);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveFilters = useCallback(() => {
    localStorage.setItem('filterSettings', JSON.stringify(hides));
  }, [hides]);

  const setExtraChurnValue = useCallback((num: number) => {
    setExtraNodeChurn(num);
  }, []);

  const setTheLeastBondChurnValue = useCallback((bond: number) => {
    setLeastBondChurn(bond);
  }, []);

  const setEnteringValues = useCallback((bond: number, count: number) => {
    setEnteringBond(bond);
    setEnteringCount(count);
  }, []);

  const setLeavingValues = useCallback((bond: number, count: number) => {
    setLeavingBond(bond);
    setLeavingCount(count);
  }, []);

  const totalAwardsCalc = useCallback(() => {
    if (!nodesQuery) return;
    let total = 0;
    for (const a in nodesQuery) {
      total = total + +nodesQuery[a].current_award;
    }
    setTotalAwards(total);
  }, [nodesQuery]);

  const monthlyNodeReturn = useCallback(() => {
    if (!totalAwards || !churnProgressValue || !network) {
      return 0;
    }

    const churnProgress = churnProgressValue;
    let churnPeriodInDays = ((churnInterval * 6) / 86400) * churnProgress;
    const thisChurnBlock = (chainsHeight?.THOR || 0) - +(churn?.height || 0);
    if (thisChurnBlock > churnInterval) {
      churnPeriodInDays = (thisChurnBlock * 6) / 86400;
    }

    const calculatedValue =
      (totalAwards / (network?.activeNodeCount || 1)) *
      (30 / churnPeriodInDays);

    return calculatedValue;
  }, [totalAwards, churnProgressValue, network, churnInterval, chainsHeight, churn]);

  const annualNodeReturn = useCallback(() => {
    if (!totalAwards || !nodesQuery || !churnProgressValue) {
      return 0;
    }

    const churnProgress = churnProgressValue;
    let churnPeriodInDays = ((churnInterval * 6) / 86400) * churnProgress;
    const thisChurnBlock = (chainsHeight?.THOR || 0) - +(churn?.height || 0);
    if (thisChurnBlock > churnInterval) {
      churnPeriodInDays = (thisChurnBlock * 6) / 86400;
    }

    const annualNodes =
      (totalAwards / (network?.activeNodeCount || 1)) *
      (365 / churnPeriodInDays);

    return annualNodes;
  }, [totalAwards, nodesQuery, churnProgressValue, network, churnInterval, chainsHeight, churn]);

  const averageApysCalc = useCallback(() => {
    if (!nodesQuery || nodesQuery.length === 0) {
      return 0;
    }

    let totalApy = 0;
    for (const node of nodesQuery) {
      totalApy += +node.apy;
    }
    const totalActiveNodes = nodesQuery.filter(
      (node: any) => node.status === 'Active'
    ).length;

    return totalApy / (totalActiveNodes || 1);
  }, [nodesQuery]);

  const churnProgress = useCallback(() => {
    if (!network || !churnInterval || !chainsHeight) {
      return;
    }

    const churnValue =
      1 -
      ((network?.nextChurnHeight || 0) - (chainsHeight?.THOR || 0)) /
      churnInterval;

    setChurnProgressValue(churnValue);

    const churnTime = (network?.nextChurnHeight || 0) - (chainsHeight?.THOR || 0);

    setChurnProgressTime(churnTime);
  }, [network, churnInterval, chainsHeight]);

  const calculateHardCap = useCallback(() => {
    if (!nodesQuery) {
      return 0;
    }

    const actNodes = nodesQuery?.filter((n: any) => n.status === 'Active');
    if (actNodes?.length === 0) {
      return 0;
    }
    if (actNodes?.length < 2) {
      return actNodes[0].total_bond;
    }

    actNodes?.sort((a: any, b: any) => +a.total_bond - +b.total_bond);
    const lowerNodes = actNodes?.slice(
      0,
      Math.floor((actNodes.length * 2) / 3)
    );

    return Math.floor(
      (Number.parseInt(lowerNodes?.slice(-1)[0]?.total_bond) ?? 0) / 10 ** 8
    );
  }, [nodesQuery]);

  const cSort = useCallback((x: any, y: any) => {
    return x?.code < y?.code ? -1 : x?.code > y?.code ? 1 : 0;
  }, []);

  const aSort = useCallback((x: any, y: any) => {
    return x?.number < y?.number ? -1 : x?.number > y?.number ? 1 : 0;
  }, []);

  const highlightSort = useCallback((x: any, y: any, col: any, rowX: any, rowY: any, name: string) => {
    const favs =
      JSON.parse(localStorage.getItem(name) || '[]')?.map((f: any) => f.address) || [];
    if (!favs || favs.length === 0) {
      return 0;
    }
    if (favs.includes(rowX.address)) {
      return -1;
    }
    if (favs.includes(rowY.address)) {
      return 1;
    }
    return 0;
  }, []);

  const onSortChange = useCallback(({ column, order }: any) => {
    setSortColumn(column);
    setSortOrder(order);
    localStorage.setItem('tableSorting', JSON.stringify({ column, order }));
  }, []);

  const formatRune = useCallback((value: number, format?: string) => {
    return value.toLocaleString() + ' RUNE';
  }, []);

  const addressFormatV2 = useCallback((value: string) => {
    return value;
  }, []);

  const normalFormat = useCallback((value: number) => {
    return value;
  }, []);

  const versionSort = useCallback((x: any, y: any) => {
    return rcompare(x, y);
  }, []);

  const activeCols = useMemo(() => {
    const chains = nodesQuery
      ? availableChains(nodesQuery.filter((n: any) => n.status === 'Active'))
        ?.sort()
        ?.map((c: string) => ({
          label: c,
          field: `behind.${c}`,
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center no-padding',
        })) || []
      : [];

    return [
      {
        label: 'Highlight',
        field: 'highlight',
        tdClass: 'center',
        thClass: 'center no-padding',
        sortFn: (x: any, y: any, col: any, rowX: any, rowY: any) =>
          highlightSort(x, y, col, rowX, rowY, 'active-nodes'),
      },
      {
        label: 'Address',
        field: 'address',
        formatFn: addressFormatV2,
        tdClass: 'mono',
      },
      {
        label: 'Churn',
        field: 'churn',
        thClass: 'center min-padding',
      },
      {
        label: 'ISP',
        field: 'isp',
        width: '50px',
        type: 'text',
        tdClass: 'center',
        thClass: 'center',
        hidden: hides?.isp ?? false,
      },
      {
        label: 'Location',
        field: 'location',
        width: '50px',
        tdClass: 'center',
        thClass: 'center',
        sortFn: cSort,
      },
      {
        label: 'Status',
        field: 'status',
        width: '70px',
        tdClass: 'center',
        thClass: 'center',
      },
      {
        label: 'Version',
        field: 'version',
        type: 'text',
        width: '80px',
        tdClass: 'center',
        sortFn: versionSort,
      },
      {
        label: 'Fee',
        field: 'fee',
        width: '80px',
        type: 'percentage',
        tdClass: 'mono',
        hidden: hides?.fee ?? false,
      },
      {
        label: 'Operator',
        field: 'operator',
        type: 'text',
        width: '90px',
        tdClass: 'mono center',
        thClass: 'center',
      },
      {
        label: 'Award',
        field: 'award',
        type: 'number',
        formatFn: normalFormat,
        tdClass: 'mono',
      },
      {
        label: 'Bond',
        field: 'total_bond',
        type: 'number',
        formatFn: normalFormat,
        tdClass: 'mono',
      },
      {
        label: 'Slash',
        field: 'slash',
        type: 'number',
        formatFn: normalFormat,
        tdClass: 'mono',
      },
      {
        label: 'Score',
        field: 'score',
        type: 'number',
        tdClass: 'mono center',
        thClass: 'center',
        hidden: hides?.score ?? false,
      },
      {
        label: 'APY',
        field: 'apy',
        type: 'percentage',
        tdClass: 'mono center',
        thClass: 'center',
      },
      {
        label: 'Vault',
        field: 'vault',
        type: 'text',
        tdClass: 'center',
        thClass: 'center min-padding',
      },
      ...chains,
      {
        label: '',
        field: 'missing_blocks',
        type: 'number',
        tdClass: 'mono center',
        thClass: 'center no-padding',
      },
      {
        label: 'RPC',
        field: 'rpcHealth',
        type: 'text',
        tdClass: 'mono center',
        thClass: 'center no-padding',
        hidden: hides?.RPC ?? false,
      },
      {
        label: 'BFR',
        field: 'bifrostHealth',
        type: 'text',
        tdClass: 'mono center',
        thClass: 'center no-padding',
        hidden: hides?.BFR ?? false,
      },
      {
        label: 'Age',
        field: 'age',
        type: 'number',
        tdClass: 'center',
        thClass: 'center',
        sortFn: aSort,
        hidden: hides?.age ?? false,
      },
    ];
  }, [nodesQuery, hides, highlightSort, addressFormatV2, cSort, versionSort, normalFormat, aSort]);

  const stbCols = useMemo(() => {
    const chains = nodesQuery
      ? availableChains(nodesQuery.filter((n: any) => n.status === 'Active'))
        ?.sort()
        ?.map((c: string) => ({
          label: c,
          field: `behind.${c}`,
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center no-padding',
        })) || []
      : [];

    return [
      {
        label: 'Highlight',
        field: 'highlight',
        tdClass: 'center',
        thClass: 'center no-padding',
        sortFn: (x: any, y: any, col: any, rowX: any, rowY: any) =>
          highlightSort(x, y, col, rowX, rowY, 'rdy-nodes'),
      },
      {
        label: 'Address',
        field: 'address',
        formatFn: addressFormatV2,
        tdClass: 'mono',
      },
      {
        label: 'Churn',
        field: 'churn',
        thClass: 'center min-padding',
      },
      {
        label: 'ISP',
        field: 'isp',
        width: '50px',
        type: 'text',
        tdClass: 'center',
        thClass: 'center',
        hidden: hides?.isp ?? false,
      },
      {
        label: 'Location',
        field: 'location',
        width: '50px',
        tdClass: 'center',
        thClass: 'center',
        sortFn: cSort,
      },
      {
        label: 'Status',
        field: 'status',
        width: '70px',
        tdClass: 'center',
        thClass: 'center',
      },
      {
        label: 'Version',
        field: 'version',
        width: '80px',
        type: 'text',
        tdClass: 'center',
        sortFn: versionSort,
      },
      {
        label: 'Fee',
        field: 'fee',
        width: '80px',
        type: 'percentage',
        tdClass: 'mono',
        hidden: hides?.fee ?? false,
      },
      {
        label: 'Operator',
        field: 'operator',
        type: 'text',
        width: '90px',
        tdClass: 'mono center',
        thClass: 'center',
      },
      {
        label: 'Bond',
        field: 'total_bond',
        type: 'number',
        formatFn: normalFormat,
        tdClass: 'mono',
      },
      {
        label: 'Slash',
        field: 'slash',
        type: 'number',
        formatFn: normalFormat,
        tdClass: 'mono',
      },
      ...chains,
      {
        label: '',
        field: 'missing_blocks',
        type: 'number',
        tdClass: 'mono center',
        thClass: 'center no-padding',
      },
      {
        label: 'RPC',
        field: 'rpcHealth',
        type: 'text',
        width: '40px',
        tdClass: 'mono center',
        thClass: 'center no-padding',
        hidden: hides?.RPC ?? false,
      },
      {
        label: 'BFR',
        field: 'bifrostHealth',
        type: 'text',
        width: '40px',
        tdClass: 'mono center',
        thClass: 'center no-padding',
        hidden: hides?.BFR ?? false,
      },
      {
        label: 'Age',
        field: 'age',
        type: 'number',
        tdClass: 'center',
        thClass: 'center',
        sortFn: aSort,
        hidden: hides?.age ?? false,
      },
    ];
  }, [nodesQuery, hides, highlightSort, addressFormatV2, cSort, versionSort, normalFormat, aSort]);

  const otherNodes = useMemo(() => {
    return [
      {
        label: 'Address',
        field: 'address',
        formatFn: addressFormatV2,
        tdClass: 'mono',
      },
      {
        label: 'ISP',
        field: 'isp',
        width: '50px',
        type: 'text',
        tdClass: 'center',
      },
      {
        label: 'Location',
        field: 'location',
        width: '50px',
        tdClass: 'center',
        sortFn: cSort,
      },
      {
        label: 'Status',
        field: 'status',
        width: '70px',
        tdClass: 'center',
        thClass: 'center',
      },
      {
        label: 'Version',
        field: 'version',
        width: '80px',
        type: 'text',
        tdClass: 'center',
        sortFn: versionSort,
      },
      {
        label: 'Fee',
        field: 'fee',
        width: '80px',
        type: 'percentage',
        tdClass: 'mono',
      },
      {
        label: 'Operator',
        field: 'operator',
        type: 'text',
        width: '100px',
        tdClass: 'mono center',
        thClass: 'center',
      },
      {
        label: 'Bond',
        field: 'total_bond',
        type: 'number',
        formatFn: normalFormat,
        tdClass: 'mono',
      },
      {
        label: 'Age',
        field: 'age',
        type: 'number',
        tdClass: 'center',
        thClass: 'center',
        sortFn: aSort,
      },
    ];
  }, [addressFormatV2, cSort, versionSort, normalFormat, aSort]);

  const activeInfo = useMemo(() => {
    return [
      {
        title: 'Active',
        rowStart: 1,
        colSpan: 1,
        grid: true,
        icon: '/assets/images/active.svg',
        items: [
          {
            name: 'Node',
            value: network?.activeNodeCount,
          },
          {
            name: 'Bond',
            value: (bondMetrics?.totalActiveBond || 0) / 10 ** 8,
            usdValue: true,
            filter: (v: number) => formatRune(v, '0,0.00a'),
          },
          {
            name: 'Average',
            value: (bondMetrics?.averageActiveBond || 0) / 10 ** 8,
            filter: (v: number) => formatRune(v, '0,0'),
            usdValue: true,
          },
          {
            name: 'Minimum',
            value: Math.floor((bondMetrics?.minimumActiveBond || 0) / 10 ** 8),
            filter: (v: number) => formatRune(v, '0,0'),
            usdValue: true,
          },
          {
            name: 'Max Effective',
            value: calculateHardCap(),
            filter: (v: number) => formatRune(v, '0,0'),
            usdValue: true,
          },
        ],
      },
    ];
  }, [network, bondMetrics, formatRune, calculateHardCap]);

  const standbyInfo = useMemo(() => {
    return [
      {
        title: 'Standby',
        rowStart: 1,
        colSpan: 1,
        grid: true,
        icon: '/assets/images/standby.svg',
        items: [
          {
            name: 'Nodes',
            value: network?.standbyNodeCount,
          },
          {
            name: 'Bond',
            value: (bondMetrics?.totalStandbyBond || 0) / 10 ** 8,
            filter: (v: number) => formatRune(v, '0,0a'),
            usdValue: true,
          },
          {
            name: 'Average',
            value: (bondMetrics?.averageStandbyBond || 0) / 10 ** 8,
            filter: (v: number) => formatRune(v, '0,0a'),
            usdValue: true,
          },
          {
            name: 'Maximum',
            value: Math.floor((bondMetrics?.maximumStandbyBond || 0) / 10 ** 8),
            filter: (v: number) => formatRune(v, '0,0a'),
            usdValue: true,
          },
          {
            name: 'Minimum',
            value: (bondMetrics?.minimumStandbyBond || 0) / 10 ** 8,
            filter: (v: number) => formatRune(v, '0,0.00a'),
            usdValue: true,
          },
          {
            name: 'Least Churn',
            value: leastBondChurn,
            filter: (v: number) => formatRune(v, '0,0.00a'),
            usdValue: true,
          },
        ],
      },
    ];
  }, [network, bondMetrics, leastBondChurn, formatRune]);

  const churnInfo = useMemo(() => {
    let churnValue;

    if (churnProgressTime > 600) {
      churnValue = blockTime(churnProgressTime, true);
    } else if (churnProgressTime) {
      churnValue = `${churnProgressTime} Block`;
    }

    if (churnProgressValue) {
      churnValue += ` | ${(churnProgressValue * 100).toFixed(3)}%`;
    }

    if (churnHalted) {
      churnValue = 'Churn Halted';
    }

    return [
      {
        title: 'Current Churn',
        rowStart: 2,
        colSpan: 1,
        grid: true,
        icon: '/assets/images/next-churn.svg',
        items: [
          {
            name: 'Next Churn',
            value: churnValue ?? 'No Churns',
            valueSlot: 'churn',
          },
          {
            name: 'Churn Interval',
            value: churnInterval,
            filter: (v: number) =>
              `${churnInterval ? blockTime(v, true) : 'N/A'}`,
          },
          {
            name: 'Total Rewards',
            value: (totalAwards || 0) / 1e8,
            usdValue: true,
            filter: (v: number) => formatRune(v, '0,0a'),
          },
          {
            name: 'Average APY ',
            value: averageApysCalc(),
            filter: (v: number) => `${(v * 100).toFixed(2)}%`,
          },
          {
            name: 'Monthly Node Return',
            value: (monthlyNodeReturn() || 0) / 1e8,
            filter: (v: number) => formatRune(v, '0,0a'),
            usdValue: true,
          },
          {
            name: 'Annual Node Return ',
            value: (annualNodeReturn() || 0) / 1e8,
            filter: (v: number) => formatRune(v, '0,0a'),
            usdValue: true,
          },
          {
            name: 'Churn Duration',
            value: churn ? `${churn.date}` : '',
          },
          {
            name: 'Churn Start',
            value: churn ? `${churn.height}` : '',
            filter: (v: number) => v.toLocaleString(),
          },
        ],
      },
    ];
  }, [churnProgressTime, churnProgressValue, churnHalted, churnInterval, totalAwards, averageApysCalc, monthlyNodeReturn, annualNodeReturn, churn, formatRune]);

  const blockRewardInfo = useMemo(() => {
    return [
      {
        title: 'Next Churn',
        rowStart: 2,
        colSpan: 1,
        grid: true,
        icon: '/assets/images/churn.svg',
        items: [
          {
            name: 'Leaving Count',
            value: leavingCount,
            filter: (v: number) => v.toLocaleString(),
          },
          {
            name: 'Leaving Bond',
            value: leavingBond / 1e8,
            filter: (v: number) => formatRune(v, '0,0.00a'),
            usdValue: true,
          },
          {
            name: 'Entering Count',
            value: enteringCount,
            filter: (v: number) => v.toLocaleString(),
          },
          {
            name: 'Entering Bond',
            value: enteringBond / 1e8,
            filter: (v: number) => formatRune(v, '0,0.00a'),
            usdValue: true,
          },
          {
            name: 'Bond Difference',
            value: (enteringBond - leavingBond) / 1e8,
            filter: (v: number) => formatRune(v, '0,0a'),
            usdValue: true,
          },
        ],
      },
    ];
  }, [leavingCount, leavingBond, enteringCount, enteringBond, formatRune]);

  const activeNodes = useMemo(() => {
    if (!nodesQuery) {
      return undefined;
    }
    let actNodes = nodesQuery.filter((e: any) => e.status === 'Active');

    actNodes = orderBy(actNodes, [(o: any) => +o.slash_points]);
    const filteredNodes: any[] = [];

    let lowestBond: number | null = null;
    let highestSlash = 0;
    let oldest = chainsHeight?.THOR ?? Number.MAX_SAFE_INTEGER;
    let oldestIndex: number | undefined = undefined;

    const lowVersions: string[] = [];
    const nodesVersion = actNodes.map((r: any) => r.version).sort(rcompare);
    const versions = countBy(nodesVersion);

    for (let i = 0; i < actNodes.length; i++) {
      const el = actNodes[i];
      if (+el.slash_points > highestSlash) {
        highestSlash = +el.slash_points;
      }

      if (el.status_since < oldest && el.requested_to_leave === false) {
        oldest = el.status_since;
        oldestIndex = i;
      }

      if (
        (!lowestBond || lowestBond > +el.total_bond) &&
        el.requested_to_leave === false
      ) {
        lowestBond = +el.total_bond;
      }

      if (
        Object.keys(versions).length > 1 &&
        el.version !== Object.keys(versions)[0] &&
        versions[Object.keys(versions)[0]] > Math.floor((actNodes.length * 2) / 3)
      ) {
        lowVersions.push(el.node_address);
      }
    }

    let extraChurn = 0;
    let leavingCountLocal = 0;
    let leavingBondLocal = 0;
    actNodes.forEach((el: any, index: number) => {
      fillNodeData(filteredNodes, el, index);

      filteredNodes[index].churn = [];

      if (lowestBond !== null && +el.total_bond === lowestBond) {
        filteredNodes[index].churn.push({
          name: 'Lowest Bond',
          icon: '/assets/images/cheap.svg',
          type:
            churnProgressValue > 0.5
              ? 'churn-out'
              : 'churn-out-candidate',
        });
        leavingBondLocal += +el.total_bond;
        leavingCountLocal += 1;
      }

      if (index === oldestIndex) {
        filteredNodes[index].churn.push({
          name: 'Oldest',
          icon: '/assets/images/old.svg',
          type:
            churnProgressValue > 0.5
              ? 'churn-out'
              : 'churn-out-candidate',
        });
        leavingBondLocal += +el.total_bond;
        leavingCountLocal += 1;
      }

      if (+el.slash_points === highestSlash) {
        filteredNodes[index].churn.push({
          name: 'Highest Slashes',
          icon: '/assets/images/angry.svg',
          type:
            churnProgressValue > 0.5
              ? 'churn-out'
              : 'churn-out-candidate',
        });
        leavingBondLocal += +el.total_bond;
        leavingCountLocal += 1;
      }

      if (
        lowVersions.includes(el.node_address) &&
        churnProgressValue > 0.9
      ) {
        filteredNodes[index].churn.push({
          name: 'Low Version',
          icon: '/assets/images/version.svg',
          type: churnProgressValue > 0.9 ? 'churn-out' : '',
        });
        extraChurn += 1;
      }

      if (el.requested_to_leave) {
        filteredNodes[index].churn.push({
          name: 'Requested to leave',
          icon: '/assets/images/arrow-down-square.svg',
          type: 'leave',
        });

        if (
          mimirs &&
          +mimirs?.DESIREDVALIDATORSET >= actNodes.length + extraChurn
        ) {
          extraChurn += 1;
        }
        leavingBondLocal += +el.total_bond;
        leavingCountLocal += 1;
      }
    });

    setExtraChurnValue(extraChurn);
    setLeavingValues(leavingBondLocal, leavingCountLocal);
    return filteredNodes;
  }, [nodesQuery, chainsHeight, churnProgressValue, mimirs, setExtraChurnValue, setLeavingValues]);

  const stbNodes = useMemo(() => {
    if (!nodesQuery) {
      return undefined;
    }
    const actNodes = nodesQuery?.filter((e: any) => e.status === 'Active');
    const nodesVersion = actNodes?.map((r: any) => r.version).sort(rcompare);
    const versions = countBy(nodesVersion);
    const activeVersion = Object.keys(versions);

    const latestVersion = activeVersion[0];
    let justLatest = false;
    if (versions[latestVersion] > Math.floor((actNodes.length * 2) / 3)) {
      justLatest = true;
    }

    let stbNodesData = nodesQuery?.filter(
      (e: any) =>
        (e.status === 'Standby' || e.status === 'Ready') &&
        (activeVersion.includes(e.version) || e.total_bond >= minBond)
    );

    if (stbNodesData.length === 0) {
      return [];
    }

    stbNodesData = orderBy(stbNodesData, [(o: any) => +o.total_bond], ['desc']);

    const filteredNodes: any[] = [];
    const churnInNumbers = 3 + newNodesChurn + extraNodeChurn;
    const remainingCount =
      +(mimirs?.DESIREDVALIDATORSET || 0) -
      (activeNodes?.length || 0) +
      leavingCount;
    let lastChurnIndex = 0;
    let churnNodes = 0;
    let enteringBondLocal = 0;
    let enteringCountLocal = 0;
    for (let i = 0; i < stbNodesData.length; i++) {
      const el = stbNodesData[i];
      fillNodeData(filteredNodes, el);

      const chainHeight = chainsHeight?.THOR;

      filteredNodes[i].churn = [];

      if (el.jail?.release_height > chainHeight) {
        filteredNodes[i].churn.push({
          name: {
            ...el.jail,
            releaseTime: moment
              .duration(
                (el.jail?.release_height - chainHeight) * 6,
                'seconds'
              )
              .humanize(),
          },
          icon: '/assets/images/handcuffs.svg',
          type: 'jail',
        });
        continue;
      }

      if (churnInNumbers > churnNodes) {
        if (justLatest && el.version !== latestVersion) {
          continue;
        }
        if (!activeVersion.includes(el.version)) {
          continue;
        }
        if (el.jail && el.jail.release_height > (chainsHeight?.THOR || 0)) {
          continue;
        }
        if (+el.total_bond < minBond) {
          continue;
        }
        if (remainingCount <= churnNodes) {
          continue;
        }
        if (el.maintenance) {
          continue;
        }
        filteredNodes[i].churn.push({
          name: 'Churning In',
          icon: '/assets/images/circle-up.svg',
          type:
            churnProgressValue > 0.5
              ? 'churn-in'
              : 'churn-in-candidate',
        });
        churnNodes++;
        enteringBondLocal += +el.total_bond;
        enteringCountLocal += 1;
        lastChurnIndex = i;
      }

      if (retiringVaults.includes(el.pub_key_set?.secp256k1)) {
        filteredNodes[i].churn.push({
          name: "Retiring Vault, Can't unbond",
          icon: '/assets/images/walker.svg',
        });
      }

      if (el.maintenance) {
        filteredNodes[i].churn.push({
          name: "Maintenance mode, won't churn",
          icon: '/assets/images/hammer.svg',
        });
      }
    }

    setEnteringValues(enteringBondLocal, enteringCountLocal);
    setTheLeastBondChurnValue(filteredNodes[lastChurnIndex]?.total_bond || 0);

    return filteredNodes;
  }, [nodesQuery, minBond, newNodesChurn, extraNodeChurn, mimirs, activeNodes, leavingCount, chainsHeight, churnProgressValue, retiringVaults, setEnteringValues, setTheLeastBondChurnValue]);

  const whiteListedNodes = useMemo(() => {
    if (!nodesQuery) {
      return undefined;
    }
    const actNodesAddresses = activeNodes?.map((n: any) => n.address) || [];
    const stbNodesAddresses = stbNodes?.map((n: any) => n.address) || [];

    let whtNodes = nodesQuery?.filter(
      (e: any) =>
        !actNodesAddresses.includes(e.node_address) &&
        e.status !== 'Disabled' &&
        e.age?.number < 300 &&
        !stbNodesAddresses.includes(e.node_address)
    );

    whtNodes = orderBy(whtNodes, [(o: any) => +o.total_bond], ['desc']);

    const filteredNodes: any[] = [];

    whtNodes.forEach((el: any) => {
      fillNodeData(filteredNodes, el);
    });

    return filteredNodes;
  }, [nodesQuery, activeNodes, stbNodes]);

  useEffect(() => {
    if (chainsHeight) {
      churnProgress();
      totalAwardsCalc();
    }
  }, [chainsHeight, churnProgress, totalAwardsCalc]);

  useEffect(() => {
    getNodeOverview();

    fetch('/api/vaults')
      .then((res) => res.json())
      .then(({ data }) => {
        setRetiringVaults(getRetiringVault(data));
      })
      .catch((e) => {
        console.error(e);
      });

    updateNodes().then(() => {
      setLoading(false);
    });

    fetch('/api/mimir')
      .then((res) => res.json())
      .then(({ data }) => {
        setMimirs(data);
      });

    const interval1 = setInterval(() => {
      updateNodes();
    }, 10 * 1000);

    const interval2 = setInterval(() => {
      getNodeOverview();
    }, 60 * 1000);

    setIntervalId(interval1);
    setSecondInterval(interval2);

    const savedFilters = localStorage.getItem('filterSettings');
    if (savedFilters) {
      setHides(JSON.parse(savedFilters));
    }

    const savedSorting = localStorage.getItem('tableSorting');
    if (savedSorting) {
      const parsedSorting = JSON.parse(savedSorting);
      setSortColumn(parsedSorting.column);
      setSortOrder(parsedSorting.order);
    }

    return () => {
      if (interval1) clearInterval(interval1);
      if (interval2) clearInterval(interval2);
    };
  }, []);

  const toggleFilter = (filterKey: keyof typeof hides) => {
    setHides((prev) => {
      const newHides = { ...prev, [filterKey]: !prev[filterKey] };
      localStorage.setItem('filterSettings', JSON.stringify(newHides));
      return newHides;
    });
  };

  const toggleHealthFilters = () => {
    setHides((prev) => {
      const newHides = { ...prev, RPC: !prev.RPC, BFR: !prev.BFR };
      localStorage.setItem('filterSettings', JSON.stringify(newHides));
      return newHides;
    });
  };

  return (
    <Page error={error && !loading} fluid={true}>
      <div className={styles['grid-network']}>
        <Card>
          <InfoCard options={activeInfo} inner={true} />
        </Card>
        <Card>
          <InfoCard options={standbyInfo} inner={true} />
        </Card>
      </div>
      <div className={styles['grid-network']}>
        <Card>
          <InfoCard options={churnInfo} inner={true} />
        </Card>
        <Card>
          <InfoCard options={blockRewardInfo} inner={true} />
        </Card>
      </div>
      <div className={styles['search-container']}>
        <div id={styles['nodes-search-container']}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search All Tables"
            className={styles['search-input']}
          />
          <SearchIcon className={styles['search-icon']} />
        </div>

        <div className={styles['filter-btns']}>
          <button
            className={`${styles['filter-button']} ${!hides.isp ? styles['enabled-btn'] : ''}`}
            onClick={() => toggleFilter('isp')}
          >
            <Caret className={`${styles['filter-icon']} ${hides.isp ? styles['disable'] : ''}`} />
            ISP
          </button>
          <button
            className={`${styles['filter-button']} ${!hides.fee ? styles['enabled-btn'] : ''}`}
            onClick={() => toggleFilter('fee')}
          >
            <Caret className={`${styles['filter-icon']} ${hides.fee ? styles['disable'] : ''}`} />
            Fee
          </button>
          <button
            className={`${styles['filter-button']} ${!hides.score ? styles['enabled-btn'] : ''}`}
            onClick={() => toggleFilter('score')}
          >
            <Caret className={`${styles['filter-icon']} ${hides.score ? styles['disable'] : ''}`} />
            Score
          </button>
          <button
            className={`${styles['filter-button']} ${!hides.age ? styles['enabled-btn'] : ''}`}
            onClick={() => toggleFilter('age')}
          >
            <Caret className={`${styles['filter-icon']} ${hides.age ? styles['disable'] : ''}`} />
            Age
          </button>
          <button
            className={`${styles['filter-button']} ${!(hides.RPC && hides.BFR) ? styles['enabled-btn'] : ''}`}
            onClick={toggleHealthFilters}
          >
            <Caret
              className={`${styles['filter-icon']} ${hides.RPC && hides.BFR ? styles['disable'] : ''}`}
            />
            Health
          </button>
        </div>
      </div>

      <Card imgSrc="/assets/images/active.svg" title="Active Nodes">
        {loading ? (
          <TableLoader
            cols={activeCols.map((col: any) => ({
              label: col.label,
              field: col.field,
              type: col.type || 'text',
            }))}
          />
        ) : (
          <NodeTable
            rows={activeNodes || []}
            cols={activeCols}
            searchTerm={searchTerm}
            name="active-nodes"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSortChanged={onSortChange}
          />
        )}
      </Card>
      <Card
        imgSrc="/assets/images/churn.svg"
        title="Eligible Nodes"
      >
        {loading ? (
          <TableLoader cols={stbCols.map((col: any) => ({
            label: col.label,
            field: col.field,
            type: col.type || 'text',
          }))} />
        ) : (
          <NodeTable
            rows={stbNodes || []}
            cols={stbCols}
            searchTerm={searchTerm}
            name="rdy-nodes"
          />
        )}
      </Card>
      <Card
        imgSrc="/assets/images/whitelist.svg"
        title="Whitelisted Nodes"
      >
        {loading ? (
          <TableLoader
            cols={otherNodes.map((col: any) => ({
              label: col.label,
              field: col.field,
              type: col.type || 'text',
            }))}
          />
        ) : (
          <NodeTable
            rows={whiteListedNodes || []}
            cols={otherNodes}
            searchTerm={searchTerm}
            name="other-nodes"
          />
        )}
      </Card>
    </Page>
  );
};

export default NodesPage;
