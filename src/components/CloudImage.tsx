import React from 'react';
import { capitalize } from '@/utils/filters';
import Tooltip from '@/components/Tooltip';

import AmazonIcon from '@/assets/images/clouds/amazon.svg';
import GoogleIcon from '@/assets/images/clouds/google.svg';
import AzureIcon from '@/assets/images/clouds/azure.svg';
import HetznerIcon from '@/assets/images/clouds/hetzner.svg';
import DigitalOceanIcon from '@/assets/images/clouds/digitalocean.svg';
import VultrIcon from '@/assets/images/clouds/vultr.svg';
import HostingerIcon from '@/assets/images/clouds/hostinger.svg';
import CogentIcon from '@/assets/images/clouds/cogent.svg';
import DatacampIcon from '@/assets/images/clouds/datacamp.svg';
import OvhIcon from '@/assets/images/clouds/ovh.svg';
import ComcastIcon from '@/assets/images/clouds/comcast.svg';
import IonosIcon from '@/assets/images/clouds/ionos.svg';
import CloudIcon from '@/assets/images/clouds/cloud.svg';

import CloudzyImage from '@/assets/images/clouds/cloudzy.png';
import LeasewebImage from '@/assets/images/clouds/leaseweb.png';

interface CloudContainerProps {
  name: string[];
}

const CloudContainer: React.FC<CloudContainerProps> = ({ name }) => {
  const findOrg = (orgName: string): React.ComponentType<any> | false | undefined => {
    const lowerName = orgName.toLowerCase();
    
    if (lowerName.includes('amazon')) {
      return AmazonIcon;
    } else if (lowerName.includes('google')) {
      return GoogleIcon;
    } else if (lowerName.includes('microsoft')) {
      return AzureIcon;
    } else if (lowerName.includes('hetzner')) {
      return HetznerIcon;
    } else if (lowerName.includes('digitalocean')) {
      return DigitalOceanIcon;
    } else if (
      lowerName.includes('the constant company') ||
      lowerName.includes('vultr') ||
      lowerName.includes('choopa')
    ) {
      return VultrIcon;
    } else if (lowerName.includes('hostinger')) {
      return HostingerIcon;
    } else if (lowerName.includes('cogent')) {
      return CogentIcon;
    } else if (lowerName.includes('datacamp')) {
      return DatacampIcon;
    } else if (lowerName.includes('ovh')) {
      return OvhIcon;
    } else if (lowerName.includes('comcast')) {
      return ComcastIcon;
    } else if (lowerName.includes('ionos')) {
      return IonosIcon;
    } else if (lowerName.includes('routerhosting') || lowerName.includes('leaseweb')) {
      return false;
    }

    return undefined;
  };

  const getType = (): React.ComponentType<any> | false | undefined => {
    const lowerName = name.map(e => e.toLowerCase());
    let host = findOrg(lowerName[0]);
    
    if (host === undefined) {
      host = findOrg(lowerName[1]);
    }

    if (host === undefined) {
      return CloudIcon;
    }

    return host;
  };

  const getImagePath = (): string => {
    const lowerName = name[0].toLowerCase();
    if (lowerName.includes('routerhosting')) {
      return CloudzyImage;
    } else if (lowerName.includes('leaseweb')) {
      return LeasewebImage;
    }
    return '';
  };

  const type = getType();
  const imagePath = getImagePath();
  const tooltipContent = capitalize(name[0]);

  return (
    <div className="cloud-container">
      {type ? (
        <Tooltip content={tooltipContent}>
          {React.createElement(type, {
            className: "asset-icon"
          })}
        </Tooltip>
      ) : imagePath ? (
        <Tooltip content={tooltipContent}>
          <img 
            src={imagePath} 
            alt={name[0]}
            className="asset-image" 
          />
        </Tooltip>
      ) : (
        <Tooltip content={tooltipContent}>
          <CloudIcon className="asset-icon" />
        </Tooltip>
      )}
    </div>
  );
};

export default CloudContainer;