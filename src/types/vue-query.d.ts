declare module '@tanstack/vue-query' {
  import type { App } from 'vue';
  import type { QueryClientConfig } from '@tanstack/query-core';
  
  export class QueryClient {
    constructor(config?: QueryClientConfig);
  }
  
  export const VueQueryPlugin: {
    install: (app: App, options: { queryClient: QueryClient }) => void;
  };
  
  export function useQueryClient(): QueryClient;
  export function useQuery(options: any): any;
  export function useMutation(options: any): any;
  
  export type { QueryClientConfig };
}
