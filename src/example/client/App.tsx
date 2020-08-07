import React, { FunctionComponent, useState, useMemo, Fragment } from "react";

import { createOpenApi, IConfiguration } from "../..";
import { TodoListApi, Configuration, Item } from "../build/src";

const { OpenApiProvider, useOpenApiCallback, useOpenApiFetch } = createOpenApi(
  (configuration) => new TodoListApi(new Configuration(configuration)),
);

const LoginButton: FunctionComponent<{
  readonly setToken: (accessToken: string) => void;
}> = ({ setToken }) => {
  const getToken = useOpenApiCallback(
    (client) => client.postAuth().then((token) => setToken(token)),
    [],
  );

  return <button onClick={() => getToken()}>Click to get a token</button>;
};

const TodoList: FunctionComponent = () => {
  const [items, invalidate] = useOpenApiFetch((c) => c.getItems(), []);

  const toggleItem = useOpenApiCallback(
    (c, item: Item) =>
      c
        .putItem({
          itemId: item.id,
          item: {
            ...item,
            done: !item.done,
          },
        })
        .then(() => invalidate(items)),
    [items],
  );

  if (items.kind === "pending") {
    return <Fragment>pending...</Fragment>;
  }

  if (items.kind === "rejected") {
    return <Fragment>error: {items.error}</Fragment>;
  }

  return (
    <ul>
      {items.value.map((item) => (
        <li key={item.id}>
          <h2>{item.title}</h2>
          <details>{item.description}</details>
          <input
            type="checkbox"
            checked={item.done}
            onClick={() => toggleItem(item)}
            readOnly
          />
        </li>
      ))}
    </ul>
  );
};

const App: FunctionComponent = () => {
  const [token, setToken] = useState<undefined | string>(undefined);

  const configuration = useMemo(
    (): IConfiguration => ({
      basePath: "http://localhost:8080",
      headers: token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {},
    }),
    [token],
  );

  return (
    <OpenApiProvider configuration={configuration}>
      {!token && <LoginButton setToken={setToken} />}
      {token && <TodoList />}
    </OpenApiProvider>
  );
};

export { App };
