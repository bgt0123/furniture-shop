import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

class SupportApiClient {
  private instance: AxiosInstance
  
  constructor(baseURL: string, token?: string) {
    this.instance = axios.create({
      baseURL: `${baseURL}/support`,
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
  
  async getSupportCases(token: string, params?: any): Promise<AxiosResponse> {
    return this.instance.get('/cases', { params })
  }
  
  async getSupportCase(token: string, caseId: string): Promise<AxiosResponse> {
    return this.instance.get(`/cases/${caseId}`)
  }
  
  async createSupportCase(token: string, caseData: any): Promise<AxiosResponse> {
    return this.instance.post('/cases', caseData)
  }
  
  async updateSupportCase(token: string, caseId: string, updateData: any): Promise<AxiosResponse> {
    return this.instance.patch(`/cases/${caseId}`, updateData)
  }
  
   async getRefundCases(token: string): Promise<AxiosResponse> {
    return this.instance.get('/cases/refunds')
  }
}

export const supportApi = new SupportApiClient('/api/v1')