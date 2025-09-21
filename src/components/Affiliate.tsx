import React from "react";
import Link from "next/link";
import { useTheme } from "@/lib/store";
import { interfaces, affiliateMap } from "@/utils";
import { nameMapping } from "@/utils";
import styles from "./Affiliate.module.css";

interface AffiliateProps {
  affiliateAddress: string | null;
  useNewIcons?: boolean;
  showLink?: boolean;
}

interface AffiliateDetail {
  name: string;
  icon?: string;
  addName?: string | null;
  darkIcon?: string | null;
}

const Affiliate: React.FC<AffiliateProps> = ({
  affiliateAddress,
  useNewIcons = false,
  showLink = true,
}) => {
  const theme = useTheme();
  const isDark = theme === "dark";

  const affiliates = React.useMemo(() => {
    return affiliateAddress ? affiliateAddress.split("/") : null;
  }, [affiliateAddress]);

  const iconExists = async (iconPath: string): Promise<boolean> => {
    try {
      const response = await fetch(iconPath, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const loadIconVariants = async (iconName: string, preferNoName = false) => {
    const icons: {
      url: string | undefined;
      urlDark: string | undefined;
    } = {
      url: undefined,
      urlDark: undefined,
    };

    if (!iconName) return icons;

    const possibleIcons = {
      noNameLight: `/assets/images/${iconName}-no-name.png`,
      noNameDark: `/assets/images/${iconName}-no-name-dark.png`,
      normalLight: `/assets/images/${iconName}.png`,
      normalDark: `/assets/images/${iconName}-dark.png`,
    };

    if (preferNoName) {
      if (isDark) {
        icons.url = (await iconExists(possibleIcons.noNameDark))
          ? possibleIcons.noNameDark
          : (await iconExists(possibleIcons.noNameLight))
          ? possibleIcons.noNameLight
          : (await iconExists(possibleIcons.normalDark))
          ? possibleIcons.normalDark
          : possibleIcons.normalLight;

        icons.urlDark = (await iconExists(possibleIcons.noNameLight))
          ? possibleIcons.noNameLight
          : (await iconExists(possibleIcons.noNameDark))
          ? possibleIcons.noNameDark
          : (await iconExists(possibleIcons.normalLight))
          ? possibleIcons.normalLight
          : possibleIcons.normalDark;
      } else {
        icons.url = (await iconExists(possibleIcons.noNameLight))
          ? possibleIcons.noNameLight
          : (await iconExists(possibleIcons.noNameDark))
          ? possibleIcons.noNameDark
          : (await iconExists(possibleIcons.normalLight))
          ? possibleIcons.normalLight
          : possibleIcons.normalDark;

        icons.urlDark = (await iconExists(possibleIcons.noNameDark))
          ? possibleIcons.noNameDark
          : (await iconExists(possibleIcons.noNameLight))
          ? possibleIcons.noNameLight
          : (await iconExists(possibleIcons.normalDark))
          ? possibleIcons.normalDark
          : possibleIcons.normalLight;
      }
    } else {
      if (isDark) {
        icons.url = (await iconExists(possibleIcons.normalDark))
          ? possibleIcons.normalDark
          : (await iconExists(possibleIcons.normalLight))
          ? possibleIcons.normalLight
          : (await iconExists(possibleIcons.noNameDark))
          ? possibleIcons.noNameDark
          : possibleIcons.noNameLight;

        icons.urlDark = (await iconExists(possibleIcons.normalLight))
          ? possibleIcons.normalLight
          : (await iconExists(possibleIcons.normalDark))
          ? possibleIcons.normalDark
          : (await iconExists(possibleIcons.noNameLight))
          ? possibleIcons.noNameLight
          : possibleIcons.noNameDark;
      } else {
        icons.url = (await iconExists(possibleIcons.normalLight))
          ? possibleIcons.normalLight
          : (await iconExists(possibleIcons.normalDark))
          ? possibleIcons.normalDark
          : (await iconExists(possibleIcons.noNameLight))
          ? possibleIcons.noNameLight
          : possibleIcons.noNameDark;

        icons.urlDark = (await iconExists(possibleIcons.normalDark))
          ? possibleIcons.normalDark
          : (await iconExists(possibleIcons.normalLight))
          ? possibleIcons.normalLight
          : (await iconExists(possibleIcons.noNameDark))
          ? possibleIcons.noNameDark
          : possibleIcons.noNameLight;
      }
    }

    return icons;
  };

  const getAffiliateNames = (name: string) => {
    const affiliates = Object.values(nameMapping).find(
      (arr) => Array.isArray(arr) && arr.includes(name)
    );
    if (affiliates && affiliates.length > 0) {
      return affiliates.join(",");
    }
    return name;
  };

  const mapAffiliateName = (affiliate: string): AffiliateDetail | undefined => {
    const ifc = (affiliateMap as any)[affiliate];

    if (!ifc) {
      return undefined;
    }

    return {
      name: ifc.name ?? ifc,
      icon: ifc.icon,
      addName: ifc.addName ?? null,
    };
  };

  const affiliateWallet = async (affiliate: string) => {
    if (!affiliate) return { name: "", icon: null, addName: null };

    affiliate = affiliate.trim();
    const detail = mapAffiliateName(affiliate);

    if (!detail) {
      return {
        name: affiliate,
        icon: null,
        addName: null,
      };
    }

    if (detail.icon) {
      const icons = await loadIconVariants(detail.icon, useNewIcons);

      return {
        icon: icons.url,
        name: detail.name,
        addName: detail.addName,
        darkIcon: icons.urlDark,
      };
    }

    return {
      icon: null,
      name: detail.name,
      addName: null,
      darkIcon: null,
    };
  };

  const navigateToAffiliate = (affiliate: string) => {
    return `/txs?type=swap&affiliate=${getAffiliateNames(affiliate)}`;
  };

  const [affiliateDetails, setAffiliateDetails] = React.useState<{
    [key: string]: any;
  }>({});

  React.useEffect(() => {
    const loadAffiliateDetails = async () => {
      if (!affiliates) return;

      const details: { [key: string]: any } = {};
      for (const affiliate of affiliates) {
        details[affiliate] = await affiliateWallet(affiliate);
      }
      setAffiliateDetails(details);
    };

    loadAffiliateDetails();
  }, [affiliates, isDark, useNewIcons]);

  const renderAffiliate = (affiliate: string) => {
    const detail = affiliateDetails[affiliate] || {
      name: affiliate,
      icon: null,
      addName: null,
      darkIcon: null,
    };

    const handleImageError = (
      event: React.SyntheticEvent<HTMLImageElement, Event>
    ) => {
      const target = event.target as HTMLImageElement;
      const currentSrc = target.src;

      if (detail.darkIcon && !currentSrc.includes(detail.darkIcon)) {
        target.src = detail.darkIcon;
        return;
      }

      target.src = "/assets/images/unknown.svg";
      target.onerror = null;
    };

    return (
      <div key={affiliate} className={styles.executed} title={detail.name}>
        {detail.icon ? (
          <img
            src={detail.icon}
            alt={detail.name}
            className={styles.affiliateIcon}
            onError={handleImageError}
            key={`${detail.icon}-${isDark}`}
          />
        ) : (
          <em>{detail.name}</em>
        )}
        {detail.addName && <em>{detail.name}</em>}
      </div>
    );
  };

  if (!affiliates || affiliates.length === 0) {
    return null;
  }

  const content = (
    <div className={styles.affiliateDirect}>
      {affiliates.map(renderAffiliate)}
    </div>
  );

  return (
    <div className={styles.affiliateContent}>
      {showLink ? (
        <Link
          href={navigateToAffiliate(affiliates[0])}
          className={styles.affiliateLink}
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};

export default Affiliate;
