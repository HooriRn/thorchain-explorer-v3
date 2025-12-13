import { apiClient } from './client'
import { getNetworkConfig, getCurrentNetwork } from './config'

export interface InfraEarningsParams {
  interval: string
  count: number
}

export interface InfraEarnings {
  [key: string]: any
}

export interface THORLastBlock {
  [key: string]: any
}

export interface BlockHeight {
  [key: string]: any
}

export interface Quote {
  [key: string]: any
}

export interface Churn {
  [key: string]: any
}

export class InfraAPI {
  private network: string
  private config: ReturnType<typeof getNetworkConfig>

  constructor() {
    this.network = getCurrentNetwork()
    this.config = getNetworkConfig(this.network as any)
  }

  async getInfraEarnings(params: InfraEarningsParams): Promise<InfraEarnings[]> {
    console.log('getInfraEarnings called with params:', params);
    console.log('SERVER_URL:', this.config.SERVER_URL);
    
    try {
      const response = await apiClient.getExternal<InfraEarnings[]>(
        `${this.config.SERVER_URL}earnings`,
        {
          params: params
        }
      );
      
      console.log('Infra earnings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getInfraEarnings:', error);
      
      const fullUrl = `${this.config.SERVER_URL}earnings?interval=${params.interval}&count=${params.count}`;
      console.log('Trying direct URL:', fullUrl);
      
      const directResponse = await fetch(fullUrl, {
        headers: {
          'x-client-id': 'thorchain.net'
        }
      });
      
      if (directResponse.ok) {
        return await directResponse.json();
      }
      
      throw error;
    }
  }

  async getTHORLastBlock(): Promise<THORLastBlock> {
    const response = await apiClient.getExternal<THORLastBlock>(
      `${this.config.SERVER_URL}api/lastBlock`
    )
    return response.data
  }

  async getBlockHeight(): Promise<BlockHeight> {
    const response = await apiClient.getExternal<BlockHeight>(
      `${this.config.SERVER_URL}api/blockHeight`
    )
    return response.data
  }

  async getQuote(params: Record<string, any>): Promise<Quote> {
    const response = await apiClient.getExternal<Quote>(
      `${this.config.SERVER_URL}api/quote`,
      params
    )
    return response.data
  }

  async getChurn(): Promise<Churn> {
    const response = await apiClient.getExternal<Churn>(
      `${this.config.SERVER_URL}churns`
    )
    return response.data
  }
}

export const infraAPI = new InfraAPI()

export const getInfraEarnings = (params: InfraEarningsParams) => infraAPI.getInfraEarnings(params)
export const getTHORLastBlock = () => infraAPI.getTHORLastBlock()
export const getBlockHeight = () => infraAPI.getBlockHeight()
export const getQuote = (params: Record<string, any>) => infraAPI.getQuote(params)
export const getChurn = () => infraAPI.getChurn() 