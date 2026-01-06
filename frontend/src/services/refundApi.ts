import axios, { AxiosInstance, AxiosResponse } from 'axios'

class RefundApiClient {
  private instance: AxiosInstance
  
  constructor(baseURL: string, token?: string) {
    this.instance = axios.create({
      baseURL: `${baseURL}/refunds`,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (token) {
      this.setAuthToken(token)
    }
  }
  
  setAuthToken(token: string): void {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
  
  clearAuthToken(): void {
    delete this.instance.defaults.headers.common['Authorization']
  }
  
  async getRefundCases(token: string, params?: any): Promise<AxiosResponse> {
    return this.instance.get('/cases', { params })
  }
  
  async getRefundCase(token: string, refundId: string): Promise<AxiosResponse> {
    return this.instance.get(`/cases/${refundId}`)
  }
  
  async createRefundRequest(token: string, caseId: string, products: any[]): Promise<AxiosResponse> {
    return this.instance.post(`/support/cases/${caseId}/refunds`, { products })
  }
  
   async getSupportCases(token: string): Promise<AxiosResponse> {
    return this.instance.get('/support/cases')
  }
}

export const refundApi = new RefundApiClient('/api/v1')