import React from 'react';
import { capitalize } from 'lodash';
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

interface CloudImageProps {
  name: string[];
}

const CloudImage: React.FC<CloudImageProps> = ({ name }) => {
  if (!name || !Array.isArray(name) || name.length === 0) {
    return <span>-</span>;
  }

  const getCloudIcon = () => {
    const providers = name.map(n => n?.toLowerCase() || '');
    
    for (const provider of providers) {
      if (provider.includes('amazon')) return AmazonIcon;
      if (provider.includes('google')) return GoogleIcon;
      if (provider.includes('microsoft') || provider.includes('azure')) return AzureIcon;
      if (provider.includes('hetzner')) return HetznerIcon;
      if (provider.includes('digitalocean')) return DigitalOceanIcon;
      if (provider.includes('vultr') || provider.includes('choopa') || provider.includes('the constant company')) return VultrIcon;
      if (provider.includes('hostinger')) return HostingerIcon;
      if (provider.includes('cogent')) return CogentIcon;
      if (provider.includes('datacamp')) return DatacampIcon;
      if (provider.includes('ovh')) return OvhIcon;
      if (provider.includes('comcast')) return ComcastIcon;
      if (provider.includes('ionos')) return IonosIcon;
    }
    
    return CloudIcon;
  };

  const Icon = getCloudIcon();
  const tooltipText = capitalize(name[0] || '');

  return (
    <Tooltip content={tooltipText}>
      <div className="cloud-container">
        <Icon className="asset-icon" />
      </div>
    </Tooltip>
  );
};

export default CloudImage;
