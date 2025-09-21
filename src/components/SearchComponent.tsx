"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchIcon from "@/assets/images/search.svg";
import CrossIcon from "@/assets/images/cross.svg";
import EnterIcon from "@/assets/images/enter.svg";
import styles from "./SearchComponent.module.css";

interface SearchComponentProps {
  useDefaultStyles?: boolean;
  showSearchIcon?: boolean;
  isMobile?: boolean;
  isExpanded?: boolean;
  isDashboardLayout?: boolean;
  onSearch?: (query: string) => void;
  onExpandedUpdate?: (expanded: boolean) => void;
  onCloseExpanded?: () => void;
  onExpandSearch?: () => void;
  onSlashFocus?: () => void;
  onSlashBlur?: () => void;
}

interface Suggestion {
  id: string;
  type: string;
  searchType: "address" | "tx" | "thorname" | "pool";
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  useDefaultStyles = true,
  showSearchIcon = true,
  isMobile = false,
  isExpanded = false,
  isDashboardLayout = false,
  onSearch,
  onExpandedUpdate,
  onCloseExpanded,
  onExpandSearch,
  onSlashFocus,
  onSlashBlur,
}) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearch, setIsSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showNoResults, setShowNoResults] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const noResultsTimeoutRef = useRef<NodeJS.Timeout>();

  const filteredSuggestions = useMemo(() => {
    if (activeFilter === "all") return suggestions;
    return suggestions.filter(
      (suggestion) => suggestion.searchType === activeFilter
    );
  }, [suggestions, activeFilter]);

  const availableFilters = useMemo(() => {
    const counts = {
      all: suggestions.length,
      address: suggestions.filter((s) => s.searchType === "address").length,
      tx: suggestions.filter((s) => s.searchType === "tx").length,
      thorname: suggestions.filter((s) => s.searchType === "thorname").length,
      pool: suggestions.filter((s) => s.searchType === "pool").length,
    };

    return [
      { type: "all", label: "All", count: counts.all },
      { type: "address", label: "Addresses", count: counts.address },
      { type: "tx", label: "Transactions", count: counts.tx },
      { type: "thorname", label: "THORNames", count: counts.thorname },
      { type: "pool", label: "Pools", count: counts.pool },
    ].filter((filter) => filter.count > 0 || filter.type === "all");
  }, [suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const searchContainer =
        searchInputRef.current?.closest("#search-container");
      const suggestionsContainer = suggestionsContainerRef.current;

      const isOutsideSearch =
        searchContainer && !searchContainer.contains(e.target as Node);
      const isOutsideSuggestions =
        showSuggestions &&
        suggestionsContainer &&
        !suggestionsContainer.contains(e.target as Node);

      if (isOutsideSearch && (isOutsideSuggestions || !showSuggestions)) {
        hideSuggestions();
        if (isMobile && isExpanded) {
          onCloseExpanded?.();
        }
      }
    };

    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.classList.add("slash-focus");
        const container = searchInputRef.current?.closest("#search-container");
        if (container) {
          container.classList.add("slash-focus-active");
        }
        onSlashFocus?.();
        return;
      }

      if (e.key === "Escape" && showSuggestions) {
        hideSuggestions();
      }
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    window.addEventListener("keydown", handleGlobalKeydown);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleGlobalKeydown);
      clearTimeouts();
    };
  }, [showSuggestions, isMobile, isExpanded, onCloseExpanded, onSlashFocus]);

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  const clearTimeouts = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (noResultsTimeoutRef.current) {
      clearTimeout(noResultsTimeoutRef.current);
    }
  }, []);

  const isInputFocused = useCallback(() => {
    return document.activeElement === searchInputRef.current;
  }, []);

  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setShowNoResults(false);
  }, []);

  const resetSearch = useCallback(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
    setShowNoResults(false);
  }, []);

  const determineSearchType = useCallback(
    (item: any): "address" | "tx" | "thorname" | "pool" => {
      const typeMap: Record<string, "address" | "tx" | "thorname" | "pool"> = {
        address: "address",
        transaction: "tx",
        tx: "tx",
        thorname: "thorname",
        pool: "pool",
      };
      return typeMap[item.type] || "address";
    },
    []
  );

  const getBadgeText = useCallback((type: string) => {
    const badgeMap: Record<string, string> = {
      address: "Address",
      tx: "Transaction",
      thorname: "THORName",
      pool: "Pool",
    };
    return badgeMap[type] || type;
  }, []);

  const getSuggestionRoute = useCallback((suggestion: Suggestion) => {
    const routes: Record<string, string> = {
      address: `/address/${suggestion.id}`,
      tx: `/tx/${suggestion.id}`,
      thorname: `/address/${suggestion.id}`,
      pool: `/pool/${suggestion.id}`,
    };
    return routes[suggestion.searchType] || `/address/${suggestion.id}`;
  }, []);

  const performSearch = useCallback(async () => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      resetSearch();
      return;
    }

    const timeoutRace = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 2000)
    );

    try {
      const result = await Promise.race([
        new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 500)),
        timeoutRace,
      ]);

      let newSuggestions: Suggestion[] = [];

      if ((result as any)?.data) {
        const processItems = (items: any[]) => {
          return items
            .filter((item) => item.id && item.type)
            .map((item) => ({
              id: item.id,
              type: item.type,
              searchType: determineSearchType(item),
            }));
        };

        if (Array.isArray((result as any).data)) {
          newSuggestions = processItems((result as any).data);
        } else if (
          (result as any).data.results &&
          Array.isArray((result as any).data.results)
        ) {
          newSuggestions = processItems((result as any).data.results);
        } else if ((result as any).data.id && (result as any).data.type) {
          newSuggestions = [
            {
              id: (result as any).data.id,
              type: (result as any).data.type,
              searchType: determineSearchType((result as any).data),
            },
          ];
        }
      }

      newSuggestions.sort((a, b) => {
        const aExact = a.id.toLowerCase() === query.toLowerCase();
        const bExact = b.id.toLowerCase() === query.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const typePriority: Record<string, number> = {
          address: 4,
          pool: 3,
          thorname: 2,
          tx: 1,
        };
        return (
          (typePriority[b.searchType] || 0) - (typePriority[a.searchType] || 0)
        );
      });

      setSuggestions(newSuggestions);
      setActiveFilter("all");
      setSelectedIndex(-1);
      setShowNoResults(newSuggestions.length === 0);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
      setShowNoResults(true);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, resetSearch, determineSearchType]);

  const onSearchInput = useCallback(() => {
    clearTimeouts();

    const query = searchQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      setShowNoResults(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);
    setSuggestions([]);
    setShowNoResults(false);

    noResultsTimeoutRef.current = setTimeout(() => {
      if (suggestions.length === 0 && !isLoading) {
        setShowNoResults(true);
      }
    }, 500);

    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 500);
  }, [
    searchQuery,
    clearTimeouts,
    suggestions.length,
    isLoading,
    performSearch,
  ]);

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;

      const keyHandlers: Record<string, () => void> = {
        ArrowDown: () => {
          if (filteredSuggestions.length === 0) return;
          const newIndex =
            selectedIndex < filteredSuggestions.length - 1
              ? selectedIndex + 1
              : 0;
          setSelectedIndex(newIndex);
        },
        ArrowUp: () => {
          if (filteredSuggestions.length === 0) return;
          const newIndex =
            selectedIndex > 0
              ? selectedIndex - 1
              : filteredSuggestions.length - 1;
          setSelectedIndex(newIndex);
        },
        Enter: () => {
          if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
            selectSuggestion(filteredSuggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            goToFirstResult();
          }
        },
        Escape: () => hideSuggestions(),
      };

      const handler = keyHandlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [
      showSuggestions,
      filteredSuggestions,
      selectedIndex,
      suggestions.length,
      hideSuggestions,
    ]
  );

  const find = useCallback(() => {
    if (isMobile && !isExpanded) {
      onExpandSearch?.();
      return;
    }

    if (!isSearch) {
      searchInputRef.current?.focus();
      return;
    }

    if (suggestions.length > 0) {
      goToFirstResult();
      return;
    }

    onSearch?.(searchQuery);
    navigateToSearchResult(searchQuery);
  }, [
    isMobile,
    isExpanded,
    isSearch,
    suggestions.length,
    searchQuery,
    onSearch,
    onExpandSearch,
  ]);

  const goToFirstResult = useCallback(() => {
    if (suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
    }
  }, [suggestions]);

  const selectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      setSearchQuery(suggestion.id);
      setShowSuggestions(false);
      setIsLoading(false);
      setSelectedIndex(-1);
      setShowNoResults(false);
      setSearchQuery("");
      onSearch?.(suggestion.id);
      const route = getSuggestionRoute(suggestion);
      router.push(route);
    },
    [onSearch, getSuggestionRoute, router]
  );

  const navigateToSearchResult = useCallback(
    (search: string) => {
      const searchUpper = search.toUpperCase();

      if (searchUpper.length <= 30) {
        handleThornameSearch(search);
      } else if (searchUpper.length <= 43) {
        router.push(`/address/${search}`);
      } else {
        router.push(`/tx/${search}`);
      }
    },
    [router]
  );

  const handleThornameSearch = useCallback(
    async (query: string) => {
      try {
        const res = await new Promise((resolve) =>
          setTimeout(
            () => resolve({ status: 200, data: { aliases: [], owner: null } }),
            100
          )
        );

        if (
          (res as any).status / 200 === 1 &&
          ((res as any).data?.aliases?.length > 0 || (res as any).data?.owner)
        ) {
          let thorchainAddr = (res as any).data?.aliases?.find(
            (el: any) => el.chain === "THOR"
          )?.address;
          if (!thorchainAddr) {
            thorchainAddr = (res as any).data.owner;
          }
          router.push(`/address/${thorchainAddr}`);
        }
      } catch (error) {
        console.error("THORName search error:", error);
      }
    },
    [router]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    hideSuggestions();
    resetSearch();
    searchInputRef.current?.focus();
  }, [hideSuggestions, resetSearch]);

  const handleActiveFilterChange = useCallback(
    (type: string) => {
      setActiveFilter(type);
      setSelectedIndex(-1);
    },
    [setActiveFilter]
  );

  const atFocus = useCallback(() => {
    setIsSearch(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
    searchInputRef.current?.classList.remove("slash-focus");
    const container = searchInputRef.current?.closest("#search-container");
    if (container) {
      container.classList.remove("slash-focus-active");
    }
    onSlashBlur?.();
  }, [suggestions.length, onSlashBlur]);

  const onBlur = useCallback(() => {
    searchInputRef.current?.classList.remove("slash-focus");
    const container = searchInputRef.current?.closest("#search-container");
    if (container) {
      container.classList.remove("slash-focus-active");
    }
    onSlashBlur?.();
  }, [onSlashBlur]);

  const search = useCallback(() => {
    setIsSearch(true);
  }, []);

  useEffect(() => {
    onSearchInput();
  }, [searchQuery, onSearchInput]);

  return (
    <div
      id="search-container"
      className={`
        ${styles.searchContainer}
        ${useDefaultStyles ? styles.defaultStyles : ""}
        ${isMobile ? styles.mobileSearch : ""}
        ${isExpanded ? styles.expanded : ""}
        ${isDashboardLayout ? styles.dashboardLayout : ""}
      `}
      onClick={search}
    >
      {showSearchIcon && (
        <SearchIcon className={styles.searchIconLeft} onClick={find} />
      )}

      <input
        ref={searchInputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`${styles.searchBarInput} ${
          isMobile && !isExpanded ? styles.hidden : ""
        }`}
        type="text"
        placeholder={
          isMobile && !isExpanded
            ? undefined
            : "Search by Address / Txn Hash / THORName"
        }
        onKeyDown={handleKeydown}
        onFocus={atFocus}
        onBlur={onBlur}
      />

      {isLoading && (
        <div className={styles.loadingSpinner}>
          <div className={styles.loadingDots}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
      )}

      {!isLoading && searchQuery.trim().length > 0 && (
        <div className={styles.actionButtons}>
          <CrossIcon className={styles.clearButton} onClick={clearSearch} />
          {suggestions.length > 0 && (
            <EnterIcon
              className={styles.enterButton}
              onClick={goToFirstResult}
            />
          )}
        </div>
      )}

      {!isLoading && searchQuery.trim().length === 0 && showSearchIcon && (
        <div className={styles.slashKey} onClick={find}>
          <span className="mono">/</span>
        </div>
      )}

      {showSuggestions && !isLoading && (
        <div
          ref={suggestionsContainerRef}
          className={`${styles.searchSuggestions} ${
            isDashboardLayout ? styles.dashboardLayout : ""
          }`}
        >
          <div className={styles.suggestionSection}>
            {suggestions.length > 0 && (
              <div className={styles.resultsHeader}>
                <div className={styles.filterTabs}>
                  {availableFilters.map((filter) => (
                    <button
                      key={filter.type}
                      className={`${styles.filterTab} ${
                        activeFilter === filter.type ? styles.active : ""
                      }`}
                      type="button"
                      onClick={() => handleActiveFilterChange(filter.type)}
                    >
                      {filter.label}
                      <span className={styles.filterCount}>{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className={styles.searchResults}>
                {filteredSuggestions.map((suggestion, index) => (
                  <Link
                    key={`suggestion-${index}`}
                    href={getSuggestionRoute(suggestion)}
                    className={`${styles.suggestionItem} ${styles.resultItem} ${
                      selectedIndex === index ? styles.selected : ""
                    }`}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={styles.suggestionIcon}>
                      <span>{suggestion.searchType}</span>
                    </div>
                    <div className={styles.suggestionDetails}>
                      <div className={styles.suggestionId}>{suggestion.id}</div>
                    </div>
                    <div className={styles.suggestionBadge}>
                      <span
                        className={`${styles.badge} ${
                          styles[
                            `badge${
                              suggestion.searchType.charAt(0).toUpperCase() +
                              suggestion.searchType.slice(1)
                            }`
                          ]
                        }`}
                      >
                        {getBadgeText(suggestion.searchType)}
                      </span>
                    </div>
                    <div className={styles.suggestionActions}>
                      <div className={styles.suggestionArrow}>→</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {showNoResults && (
              <div className={styles.noResults}>
                <div className={styles.noResultsContent}>
                  <div className={styles.noResultsIconContainer}>
                    <div className={styles.noResultsIcon}>
                      <SearchIcon />
                    </div>
                  </div>
                  <div className={styles.noResultsText}>
                    <h4>No results found</h4>
                    <p>Try different keywords or check spelling</p>
                  </div>
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className={styles.helpIndicator}>
                <div className={styles.helpContent}>
                  <div className={`${styles.keyIndicator} mono`}>ESC</div>
                  <small className={styles.helpText}>close</small>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SearchComponent;
