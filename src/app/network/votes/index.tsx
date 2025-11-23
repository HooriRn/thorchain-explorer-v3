"use client";

import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import StatsPanel from "@/components/StatsPanel";
import Card from "@/components/ui/Card";
import Address from "@/components/transactions/Address";
import { Progress } from "@/components/ui/progressBar";
import { Badge } from "@/components/ui/badge";
import SearchIcon from "@/assets/images/search.svg";
import Page from "@/components/PageContainer";
import VoteList from "./components/VoteList";
import styles from "./Votes.module.css";

import { getHumanizeDuration } from "@/utils/global";

type VoteApi = any;

type VoteInfo = {
  value: string;
  keys: Record<string, { addresses: string[]; votesInLast24h: number }>;
  latestVote: number;
  earliestVote: number;
  mimirValue?: number;
  notVoted: string[];
};

const VotesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [votes, setVotes] = useState<VoteApi[]>([]);
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [votesRequired, setVotesRequired] = useState(0);
  const [formattedVotes, setFormattedVotes] = useState<VoteInfo[]>([]);
  const [mimirData, setMimirData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [last24HVotes, setLast24HVotes] = useState(0);

  const fetchVotesData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [votesRes, nodesRes, mimirRes] = await Promise.all([
        fetch("/api/votes").then((res) => res.json()),
        fetch("/api/nodes").then((res) => res.json()),
        fetch("/api/mimir").then((res) => res.json()),
      ]);

      console.log("Votes Response:", votesRes);
      console.log("Nodes Response:", nodesRes);
      console.log("Mimir Response:", mimirRes);

      if (!votesRes.success || !nodesRes.success || !mimirRes.success) {
        setError(true);
        return;
      }

      const votesData = votesRes.data || [];
      const nodesData = nodesRes.data || [];
      const mimirDataResponse = mimirRes.data || {};

      const actives = nodesData
        .filter((n: any) => n.status === "Active")
        .map((n: any) => n.node_address);

      console.log("Active Nodes:", actives);

      setVotes(votesData);
      setActiveNodes(actives);
      setVotesRequired(Math.floor((actives.length * 2) / 3) + 1);
      setMimirData(mimirDataResponse);
    } catch (e) {
      console.error("Error fetching votes data:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotesData();
  }, []);

  useEffect(() => {
    if (!votes.length || !activeNodes.length) return;

    processVotes();
  }, [votes, activeNodes, mimirData]);

  const processVotes = () => {
    console.log("Processing votes:", votes);
    console.log("Active nodes:", activeNodes);
    console.log("Mimir data:", mimirData);

    const twentyFourHoursAgo = moment().subtract(24, "hours");
    let total24h = 0;

    const processed: VoteInfo[] = votes.map((vote: any) => {
      const info: VoteInfo = {
        value: vote.value,
        keys: {},
        latestVote: +vote.votes[0].date,
        earliestVote: +vote.votes[vote.votes.length - 1].date,
        mimirValue: mimirData[vote.value],
        notVoted: [...activeNodes],
      };

      vote.votes.forEach(({ key, date, address }: any) => {
        const formattedDate = moment(date / 1e6);
        if (!info.keys[key]) {
          info.keys[key] = { addresses: [], votesInLast24h: 0 };
        }

        const delIndex = info.notVoted.indexOf(address);
        if (delIndex === -1) return;

        info.keys[key].addresses.push(address);
        info.notVoted.splice(delIndex, 1);

        if (formattedDate.isAfter(twentyFourHoursAgo)) {
          info.keys[key].votesInLast24h += 1;
          total24h += 1;
        }
      });

      return info;
    });

    processed.sort((a, b) => b.latestVote - a.latestVote);
    setFormattedVotes(processed);
    setLast24HVotes(total24h);

    const recents: any[] = [];
    votes.forEach((v: any) => {
      v.votes.forEach(({ key, date, address }: any) => {
        recents.push({
          nodeAddress: address,
          voteValue: v.value,
          value: key,
          date: date / 1e6,
        });
      });
    });
    recents.sort((a, b) => b.date - a.date);
    setRecentVotes(recents.slice(0, 10));
  };

  const isVotePassed = (
    o: { addresses: string[] },
    key: string,
    value: string
  ) => {
    if (mimirData[value] === +key) return true;
    if (votesRequired <= o.addresses.length) return true;
    return false;
  };

  const getColorForVote = (passed: boolean, key: string) => {
    if (passed) return "#2ecc71";
    const colors = [
      "#3498db",
      "#9b59b6",
      "#e84393",
      "#e67e22",
      "#e74c3c",
      "#f1c40f",
    ];
    const k = Number(key);
    if (Number.isNaN(k)) return colors[0];
    return colors[k % colors.length];
  };

  const filteredVotes = useMemo(() => {
    if (!searchQuery) return formattedVotes;
    const q = searchQuery.toLowerCase();
    return formattedVotes.filter((v) => {
      if (v.value.toLowerCase().includes(q)) return true;
      for (const k in v.keys) {
        if (
          v.keys[k].addresses.some((addr) => addr.toLowerCase().includes(q))
        ) {
          return true;
        }
      }
      return false;
    });
  }, [formattedVotes, searchQuery]);

  const governanceStats = useMemo(
    () => [
      {
        label: "Active Nodes",
        value: activeNodes.length,
        filter: (v: any) => String(v),
      },
      {
        label: "Consensus",
        value: votesRequired,
        filter: (v: any) => String(v),
      },
      {
        label: "24H Votes",
        value: last24HVotes,
        filter: (v: any) => String(v),
      },
      {
        label: "Latest Vote",
        value: formattedVotes[0]?.value || "-",
        filter: (v: any) => String(v),
      },
      {
        label: "30D Proposals",
        value: votes.length,
        filter: (v: any) => String(v),
      },
    ],
    [
      activeNodes.length,
      votesRequired,
      last24HVotes,
      formattedVotes,
      votes.length,
    ]
  );

  return (
    <Page error={error} fluid={false}>
      <div>
        <StatsPanel metrics={governanceStats as any} />

        <h3 className={styles.recentVotesHeader}>Latest Votes</h3>
        <div className={styles.recentVotesContainer}>
          {recentVotes.map((vote, index) => (
            <div key={index} className={styles.recentVoteCard}>
              <div className={styles.recentVoteContent}>
                <span className={styles.voteValue}>{vote.voteValue}</span>
                <div className={styles.keyName}>
                  <small>Value :</small>
                  <b>{vote.value}</b>
                </div>
                <div style={{ display: "flex" }}>
                  <Address address={vote.nodeAddress} />
                </div>
              </div>
              <div className={styles.voteDate}>
                <small>Date:</small>
                <b style={{ marginLeft: 6 }}>
                  {moment(vote.date).format("MM/DD/YYYY HH:mm:ss")}
                </b>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.searchContainer}>
          <div className={styles["vote-search-container"]}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Mimir key or node address"
              className={styles.searchInput}
            />
            <SearchIcon className={styles.searchIcon} />
          </div>

          <div className={styles.votesContainer}>
            {filteredVotes.map((vote, idx) => (
              <Card
                key={idx}
                title={vote.value}
                extraClass="card-container"
                header={
                  vote.mimirValue !== undefined ? (
                    <Badge variant="green" className={styles["current-badge"]}>
                      Current:
                      <strong>{vote.mimirValue}</strong>
                    </Badge>
                  ) : undefined
                }
              >
                <div className={styles.voteCard}>
                  <div className={styles.cardBody}>
                    {Object.entries(vote.keys).map(([key, o]) => (
                      <div className={styles.voteSection} key={key}>
                        <div className={styles.progressSection}>
                          <div className={styles.progressOvertext}>
                            <div className={styles.keyName}>
                              <small>Value :</small>
                              <b>{key}</b>
                            </div>
                            <div className={styles.keyName}>
                              {isVotePassed(o, key, vote.value) && (
                                <Badge
                                  variant="green"
                                  style={{
                                    fontSize: "12px",
                                    padding: "2px 6px",
                                  }}
                                >
                                  Active
                                </Badge>
                              )}
                              <b>{o.addresses.length}</b>
                              <small>/ {votesRequired}</small>
                            </div>
                          </div>
                          <Progress
                            width={
                              (o.addresses.length * 100) / (votesRequired || 1)
                            }
                            height="8px"
                            color="var(--primary)"
                          />
                        </div>
                        <div className={styles.voteFooter}>
                          <VoteList
                            addresses={o.addresses}
                            color={getColorForVote(
                              isVotePassed(o, key, vote.value),
                              key
                            )}
                            searchQuery={searchQuery}
                          />
                          {o.votesInLast24h > 0 && (
                            <div className={styles.change24h}>
                              24H Votes: <b>{o.votesInLast24h}</b>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className={styles.voteSection}>
                      <div className={styles.progressSection}>
                        <div className={styles.progressOvertext}>
                          <div className={styles.keyName}>
                            <Badge variant="red">Not Voted</Badge>
                          </div>
                          <div className={styles.keyName}>
                            <b>{vote.notVoted.length}</b>
                            <small>/ {activeNodes.length}</small>
                          </div>
                        </div>
                        <div className={styles.voteFooter}>
                          <VoteList
                            addresses={vote.notVoted}
                            color="#e74c3c"
                            searchQuery={searchQuery}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.voteSection}>
                      <div className={styles.progressSection}>
                        <div className={styles.voteFooter}></div>
                        <div className={styles.progressOvertext}>
                          <div>
                            <span>Latest Vote:</span>
                            <strong style={{ marginLeft: 6 }}>
                              {getHumanizeDuration(vote.latestVote / 1e6)}
                            </strong>
                          </div>
                          <div>
                            <span>Earliest Vote:</span>
                            <strong style={{ marginLeft: 6 }}>
                              {getHumanizeDuration(vote.earliestVote / 1e6)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <small>
            <sup>*</sup> Vote keys are sorted by the latest vote date.
          </small>
        </div>
      </div>
    </Page>
  );
};

export default VotesPage;
