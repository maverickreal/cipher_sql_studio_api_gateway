export interface ServiceClient {
  connect(uri: string): Promise<unknown> | void;
  disconnect(): Promise<void>;
};
