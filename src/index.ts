import {
  DependencyList,
  createContext,
  FunctionComponent,
  ReactNode,
  useMemo,
  createElement,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type AsyncValue<T> =
  | {
      readonly kind: "pending";
    }
  | {
      readonly kind: "resolved";
      readonly value: T;
    }
  | {
      readonly kind: "rejected";
      readonly error: Error;
    };

export interface IConfiguration {
  basePath?: string; // override base path
  username?: string; // parameter for basic security
  password?: string; // parameter for basic security
  apiKey?: string | ((name: string) => string); // parameter for apiKey security
  accessToken?: string | ((name?: string, scopes?: string[]) => string); // parameter for oauth2 security
  headers?: Record<string, string>; // header params we want to use on every request
  credentials?: RequestCredentials; // value for the credentials param we want to use on each request
}

type UseOpenApiFetch<Api> = <T>(
  fetch: (client: Api) => Promise<T>,
  deps: DependencyList,
) => [AsyncValue<T>, (staleValue?: AsyncValue<T>) => void];

type UseOpenApiCallback<Api> = <T, A1 = void, A2 = void, A3 = void, A4 = void>(
  fn: (client: Api, a1: A1, a2: A2, a3: A3, a4: A4) => T,
  deps: DependencyList,
) => (a1: A1, a2: A2, a3: A3, a4: A4) => T;

export type OpenApiProvider = FunctionComponent<{
  readonly configuration?: IConfiguration;
  readonly children: ReactNode;
}>;

export const createOpenApi = <Api>(
  createClient: (configuration: IConfiguration) => Api,
): {
  readonly OpenApiProvider: OpenApiProvider;
  readonly useOpenApiClient: () => Api;
  readonly useOpenApiFetch: UseOpenApiFetch<Api>;
  readonly useOpenApiCallback: UseOpenApiCallback<Api>;
} => {
  const OpenApiContext = createContext<Api>(createClient({}));

  const OpenApiProvider: OpenApiProvider = ({ configuration, children }) => {
    const client = useMemo(() => createClient(configuration ?? {}), [
      configuration,
    ]);
    return createElement(OpenApiContext.Provider, { value: client, children });
  };

  const useOpenApiClient = (): Api => useContext(OpenApiContext);

  const useOpenApiFetch: UseOpenApiFetch<Api> = <T>(
    fetch: (client: Api) => Promise<T>,
    deps: DependencyList,
  ) => {
    const client = useOpenApiClient();
    const [state, setState] = useState<AsyncValue<T>>({ kind: "pending" });
    const [lastValidated, setLastValidated] = useState(Date.now());

    const invalidate = useCallback((staleValue?: AsyncValue<T>) => {
      setLastValidated(Date.now());
      setState(staleValue ?? { kind: "pending" });
    }, []);

    useEffect(() => {
      setState({ kind: "pending" });
    }, [client, ...deps]);

    useEffect(() => {
      let isCancelled = false;
      fetch(client)
        .then((value) => {
          if (!isCancelled) {
            setState({ kind: "resolved", value });
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            setState({ kind: "rejected", error });
          }
        });
      return () => {
        isCancelled = true;
      };
    }, [client, lastValidated, ...deps]);

    const value = useMemo(
      (): [AsyncValue<T>, () => void] => [state, invalidate],
      [state, invalidate],
    );

    return value;
  };

  const useOpenApiCallback: UseOpenApiCallback<Api> = (fn, deps) => {
    const client = useOpenApiClient();
    return useCallback(
      (
        a1: Parameters<typeof fn>[1],
        a2: Parameters<typeof fn>[2],
        a3: Parameters<typeof fn>[3],
        a4: Parameters<typeof fn>[4],
      ) => fn(client, a1, a2, a3, a4),
      [client, ...deps],
    );
  };

  return {
    OpenApiProvider,
    useOpenApiClient,
    useOpenApiFetch,
    useOpenApiCallback,
  };
};
