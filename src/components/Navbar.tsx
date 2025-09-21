"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThorchainLogo from "@/assets/images/thorchain-logo.svg";
import BlueElectra from "@/assets/images/blueelectra.svg";
import MenuIcon from "@/assets/images/menu-burger.svg";
import CrossIcon from "@/assets/images/cross.svg";
import MoonIcon from "@/assets/images/moon-icon.svg";
import SunIcon from "@/assets/images/sun-icon.svg";
import { mainnetNav } from "@/constants/mainnet";
import { stagenetNav } from "@/constants/stagenet";
import links from "@/constants/links";
import { useAppStore } from "@/lib/store";
import styles from "./Navbar.module.css";

export default function NavBar() {
  const pathname = usePathname();
  const { theme, setTheme, showMenu, toggleMenu } = useAppStore();

  const [isMobile, setIsMobile] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState<
    Record<string, boolean>
  >({});
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "mainnet";

  const navbarLists = React.useMemo(() => {
    switch (networkEnv) {
      case "mainnet":
        return mainnetNav.navbarLists;
      case "stagenet":
        return stagenetNav.navbarLists;
      default:
        return stagenetNav.navbarLists;
    }
  }, [networkEnv]);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900 && showMenu) {
        toggleMenu();
      }
      setIsMobile(window.innerWidth <= 990);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        !event.target ||
        !(event.target as Element).closest(`.${styles.navbarContainer}`)
      ) {
        closeAllSubmenus();
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("click", handleDocumentClick);

    setIsMobile(window.innerWidth <= 990);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [showMenu, toggleMenu]);

  const closeMenu = () => {
    toggleMenu();
    closeAllSubmenus();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);

    setOpenSubmenus({});
  };

  const toggleSubmenu = (index: number) => {
    setOpenSubmenus((prev) => {
      const newState = { ...prev };

      Object.keys(newState).forEach((key) => {
        if (key !== index.toString()) {
          newState[key] = false;
        }
      });

      newState[index] = !newState[index];
      return newState;
    });

    if (openSubmenus[index]) {
      setIsDropdownOpen(false);
    }
  };

  const closeAllSubmenus = () => {
    setOpenSubmenus({});
    setIsDropdownOpen(false);
    if (isMobile && showMenu) {
      toggleMenu();
    }
  };

  const isActive = (item: any) => {
    return (
      pathname === item.link ||
      (item.submenu &&
        item.submenu.some((subItem: any) => pathname === subItem.link))
    );
  };

  const handleSetTheme = (newTheme: string) => {
    if (newTheme === "BlueElectra") {
      setTheme("BlueElectra");
    } else {
      setTheme(newTheme as "light" | "dark" | "system");
    }
    setIsDropdownOpen(false);
  };

  const gotoInstance = (instance: string, disabled: boolean) => {
    if (disabled) return "#";
    return links[instance as keyof typeof links];
  };

  return (
    <div className={`${styles.navbarContainer} ${showMenu ? styles.menu : ""}`}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.logoLink}>
          <div className={styles.logoWrapper}>
            <ThorchainLogo className={styles.logo} />
            <div className={styles.thorchainName}>
              <strong>THORChain</strong>
              Explorer
            </div>
          </div>
        </Link>

        <div className={styles.menuWrapper} onClick={() => toggleMenu()}>
          {!showMenu ? (
            <MenuIcon className={styles.icon} />
          ) : (
            <CrossIcon className={styles.icon} />
          )}
        </div>
      </div>

      <div className={styles.navbarLists}>
        {navbarLists.map((item, index) => (
          <React.Fragment key={index}>
            {item && item.link && (
              <>
                {isMobile ? (
                  <div
                    id={`menu-item-${index}`}
                    className={`${styles.navbarItem} ${
                      pathname.includes(item.link || "") ? styles.active : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.submenu) {
                        toggleSubmenu(index);
                      } else {
                        closeAllSubmenus();
                      }
                    }}
                  >
                    <div className={styles.navbarWrap}>
                      <span className={styles.navbarText}>{item.name}</span>
                      {item.submenu && (
                        <span
                          className={`${styles.dropdownIcon} ${
                            openSubmenus[index] ? styles.rotated : ""
                          }`}
                        ></span>
                      )}
                    </div>
                    {item.submenu && (
                      <div
                        id={`submenu-${index}`}
                        className={`${styles.submenu} ${
                          openSubmenus[index] ? styles.open : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.submenu
                          .filter((it: any) => it.link)
                          .map((subItem: any, subIndex: number) => (
                            <Link
                              key={subIndex}
                              href={subItem.link}
                              className={`${styles.submenuItem} ${
                                isActive(subItem) ? styles.active : ""
                              }`}
                              onClick={closeAllSubmenus}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.navbarItem}>
                    {item.submenu ? (
                      <>
                        <div className={styles.navbarWrap}>
                          <span className={styles.navbarText}>{item.name}</span>
                          <span className={styles.dropdownIcon}></span>
                        </div>
                        <div className={styles.desktopSubmenu}>
                          <div className={styles.submenu}>
                            {item.submenu
                              .filter((it: any) => it.link)
                              .map((subItem: any, subIndex: number) => (
                                <Link
                                  key={subIndex}
                                  href={subItem.link}
                                  className={styles.submenuItem}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <Link
                        id={`navbar-${item.name}`}
                        href={item.link}
                        className={styles.navbarWrap}
                        onClick={closeAllSubmenus}
                      >
                        <span className={styles.navbarText}>{item.name}</span>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </React.Fragment>
        ))}

        {showMenu && (
          <div
            className={`${styles.navbarItem} ${styles.dropdownWrapper}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
          >
            <div className={styles.navbarWrap}>
              <span className={styles.navbarText}>Appearance & Network</span>
              <span
                className={`${styles.dropdownIcon} ${
                  isDropdownOpen ? styles.rotated : ""
                }`}
              ></span>
            </div>
            <div
              className={`${styles.dropdownMenu} ${
                isDropdownOpen ? styles.open : ""
              }`}
            >
              <div id="theme-wrapper" className={styles.dropdownItem}>
                <div className={styles.settingsContainer}>
                  <div
                    className={`${styles.settingsOption} ${
                      theme === "dark" ? styles.active : ""
                    }`}
                    onClick={() => handleSetTheme("dark")}
                  >
                    <MoonIcon className={styles.menuIcon} />
                    <div>Dark</div>
                  </div>
                  <div
                    className={`${styles.settingsOption} ${
                      theme === "light" ? styles.active : ""
                    }`}
                    onClick={() => handleSetTheme("light")}
                  >
                    <SunIcon className={styles.menuIcon} />
                    <div>Light</div>
                  </div>
                  <div
                    className={`${styles.settingsOption} ${
                      theme === "BlueElectra" ? styles.active : ""
                    }`}
                    onClick={() => handleSetTheme("BlueElectra")}
                  >
                    <BlueElectra className={styles.menuIcon} />
                    <div>BlueElectra</div>
                  </div>
                </div>
                <div className={styles.line}></div>
                <div className={styles.settingsContainer}>
                  <div className={styles.settingsOption}>
                    <a
                      className={networkEnv === "mainnet" ? styles.active : ""}
                      href={gotoInstance("mainnet", networkEnv === "mainnet")}
                    >
                      Mainnet
                    </a>
                  </div>
                  <div className={styles.settingsOption}>
                    <a
                      className={networkEnv === "stagenet" ? styles.active : ""}
                      href={gotoInstance("stagenet", networkEnv === "stagenet")}
                    >
                      Stagenet
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
