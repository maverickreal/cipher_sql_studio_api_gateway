export interface ServiceClient {
  connect(uri: string, cache_name?: string): Promise<unknown> | void;
  disconnect(): Promise<void>;
}
