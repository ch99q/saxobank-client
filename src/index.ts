// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Browser-compatible base64 encoding
const encodeBase64 = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    // Browser environment
    return btoa(str);
  } else {
    // Node.js environment
    return Buffer.from(str, 'utf-8').toString('base64');
  }
};

const INTERNAL = Symbol("internal");
const lock = <T>(obj: T): T => {
  Object.defineProperty(obj, INTERNAL, { enumerable: false });
  return Object.freeze(obj);
}

export const internal = (obj: any) => obj[INTERNAL];

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Client {
  id: string,
  key: string,
  name: string,
  getAccounts(): Promise<Account[]>,
  getPositions(account_id?: string): Promise<Position[]>,
  getOrders(): Promise<Order[]>
}

export interface Account {
  id: string,
  key: string,
  active: boolean,
  currency: string,
  getBalance(): Promise<Balance>,
  getPositions(): Promise<Position[]>,
  buy(uic: number, quantity: number, type?: Order["order_type"], price?: number, stop_limit?: number): Promise<Position | Order>,
  sell(uic: number, quantity: number, type?: Order["order_type"], price?: number, stop_limit?: number): Promise<Position | Order>,
}

export interface Balance {
  /** The current cash balance of the account/client. */
  cashBalance: number;
  /** The current cash available for trading in the account/client. */
  cashAvailable: number;
  totalValue: number;
  /** Sum of maintenance margin used for current positions on the account/client. */
  marginUsed: number;
  /** Margin available for opening new positions. */
  marginAvailable: number;
  unrealizedPnL: number;
  /** The account currency */
  currency: string;
}

export interface Position {
  /** The unique identifier for the position */
  id: string;
  /** The unique identifier for the instrument */
  uic: number;
  /** The identifier for the client placing the order */
  client_id: string;
  /** The identifier for the account associated with the order */
  account_id: string;
  /** The internal order id */
  order_id: string;
  /** The position status */
  status: "open" | "closed" | "closing" | "partial" | "locked";
  /** The position quantity */
  quantity: number;
  /** The placed order price */
  price: number;
  /** The value of the position in the account's currency */
  value: number;
  /** The position's currency */
  currency: string;
}

export interface Order {
  /** The unique identifier for the order */
  id: string;
  /** The timestamp when the order was created */
  time: Date;
  /** The unique identifier for the instrument */
  uic: number;
  /** The type of order, either "buy" or "sell" */
  type: "buy" | "sell";
  /** The type of order execution */
  order_type: "market" | "limit" | "stop" | "stop_limit";
  /** The current status of the order */
  status: "filled" | "working" | "parked";
  /** The price at which the order is placed */
  price: number;
  /** The quantity of the instrument to be traded */
  quantity: number;
  /** The identifier for the client placing the order */
  client_id: string;
  /** The identifier for the account associated with the order */
  account_id: string;
  /** The identifier for the exchange where the order is placed */
  exchange_id: string;
}

export interface AppConfig {
  /** Saxobank app key */
  appKey: string;
  /** Saxobank app secret */
  appSecret: string;
  /** OAuth redirect URI */
  redirectUri: string;
  /** API gateway endpoint (defaults to sim) */
  apiEndpoint?: string;
  /** Auth endpoint (defaults to sim) */
  authEndpoint?: string;
}

type Credentials = {
  type: "account";
  username: string;
  password: string;
} | {
  type: "token";
  token: string;
}

const authenticate = async (username: string, password: string, config: AppConfig): Promise<TokenResponse> => {
  const STATE = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // Step 1: Generate auth URL and fetch initial login page
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.appKey,
    state: STATE,
    redirect_uri: config.redirectUri,
  });
  const authUrl = `${config.authEndpoint}/authorize?${params.toString()}`;
  const initialResponse = await fetch(authUrl, { redirect: "manual" });
  const loginUrl = initialResponse.headers.get("location");
  if (!loginUrl || !loginUrl.includes("saxobank.com")) {
    throw new Error("Unexpected redirect during authentication");
  }

  // Step 2: Submit login credentials
  const loginResponse = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      PageLoadInfo: "0|0",
      LoginSubmitTime: String(new Date().getTime()),
      field_userid: username,
      field_password: password,
      Platform: "MacIntel",
      IsMobile: "0",
      Locality: "en-GB",
      field_isSrp: "false",
    }).toString(),
    redirect: "manual",
  });

  // Step 3: Handle redirects after login
  const postLoginUrl = loginResponse.headers.get("location");
  if (!postLoginUrl) {
    throw new Error("Login failed, no redirect received");
  }

  const finalResponse = await fetch(postLoginUrl, {
    headers: {
      "Cookie": loginResponse.headers.get("set-cookie") || "",
    },
    redirect: "manual",
  });
  const finalUrl = new URL(finalResponse.headers.get("location") || "");
  const authCode = finalUrl.searchParams.get("code");

  if (!authCode) {
    throw new Error("Failed to retrieve authorization code");
  }

  // Step 4: Exchange authorization code for an access token
  const credentials = encodeBase64(`${config.appKey}:${config.appSecret}`);
  const tokenResponse = await fetch(`${config.authEndpoint}/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to fetch token: ${tokenResponse.statusText}`);
  }

  return await tokenResponse.json() as TokenResponse;
};

const request = async (token: string, endpoint: string, apiEndpoint: string, queryParams: Record<string, string | number> = {}, method: string = "GET"): Promise<Any> => {
  const url = new URL(`${apiEndpoint}${endpoint}`);
  Object.entries(queryParams).forEach(([key, value]) => url.searchParams.append(key, String(value)));
  const response = await fetch(url.href, {
    method: method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
  return response.json();
};

const handleError = (response: Any) => {
  if (response?.ErrorCode) {
    const code = response.ErrorCode;
    const message = response.Message;
    throw new Error(`API request failed with error ${code}: ${message}\n    ${JSON.stringify(response.ModelState)}\n`);
  }
  if (response?.ErrorInfo) {
    const code = response.ErrorInfo.ErrorCode;
    const message = response.ErrorInfo.Message;
    throw new Error(`API request failed with error ${code}: ${message}`);
  }
  return response;
};

export const createClient = async (auth: Credentials, config: AppConfig) => {
  // Provide default endpoints for simulation environment
  const clientConfig: Required<AppConfig> = {
    apiEndpoint: "https://gateway.saxobank.com/sim/openapi",
    authEndpoint: "https://sim.logonvalidation.net",
    ...config,
  };

  const token = auth.type === "token" ? { access_token: auth.token } : await authenticate(auth.username, auth.password, clientConfig);

  const client_data = await request(token.access_token, "/port/v1/clients/me", clientConfig.apiEndpoint).then(handleError);

  const client_id = client_data.ClientId;
  const client_key = client_data.ClientKey;

  const getPositions = async (account_key?: string) => (await request(token.access_token, account_key ? `/port/v1/positions?ClientKey=${client_key}&AccountKey=${account_key}` : "/port/v1/positions/me", clientConfig.apiEndpoint).catch(handleError).then(handleError))?.Data?.map(({ PositionId, PositionBase, PositionView }: Any) => (lock({
    id: PositionId,
    uic: PositionBase.Uic,
    client_id,
    account_id: PositionBase.AccountId,
    order_id: PositionBase.SourceOrderId,
    status: PositionBase.Status,
    quantity: PositionBase.Amount,
    price: PositionBase.OpenPrice,
    value: PositionView.CurrentPrice,
    currency: PositionView.ExposureCurrency,
    [INTERNAL]: { PositionId, PositionBase, PositionView },
  }))) as Position[];

  const getOrders = async (account_key?: string) => (await request(token.access_token, account_key ? `/port/v1/orders?ClientKey=${client_key}&AccountKey=${account_key}` : "/port/v1/orders/me", clientConfig.apiEndpoint).catch(handleError).then(handleError))?.Data?.map((order: Any) => (lock({
    id: order.OrderId,
    time: new Date(order.OrderTime),
    uic: order.Uic,
    type: order.BuySell.toLowerCase(),
    order_type: order.OpenOrderType === "Market" ? "market"
      : order.OpenOrderType === "Limit" ? "limit"
        : order.OpenOrderType === "Stop" ? "stop"
          : order.OpenOrderType === "StopLimit" ? "stop_limit"
            : order.OpenOrderType,
    status: order.Status === "Filled" ? "filled"
      : order.Status === "Working" ? "working"
        : order.Status === "Parked" ? "parked"
          : order.Status,
    price: order.Price,
    quantity: order.Amount,
    client_id: order.ClientId,
    account_id: order.AccountId,
    exchange_id: order.Exchange?.ExchangeId,
    [INTERNAL]: order,
  }))) as Order[];

  const getBalance = async (account_key: string) => await request(token.access_token, `/port/v1/balances?ClientKey=${client_key}&AccountKey=${account_key}`, clientConfig.apiEndpoint).catch(handleError).then(handleError).then((response: Any) => (lock({
    balance: response.CashAvailableForTrading,
    currency: response.Currency,
    [INTERNAL]: response
  }))) as Balance;

  const createOrder = async (account_key: string, type: Order["type"], uic: number, quantity: number, order_type: Order["order_type"] = "market", price?: number, stop_limit?: number) => {
    if (order_type === "stop" && !stop_limit) throw new Error("Stop orders require a stop limit price");
    if (order_type === "market" && (price || stop_limit)) throw new Error("Market orders cannot have a price or stop limit");
    if (["limit", "stop_limit"].includes(order_type) && !price) throw new Error("Limit orders require a price");
    if (["market", "stop", "limit", "stop_limit"].includes(order_type) === false) throw new Error("Invalid order type");
    return await fetch(`${clientConfig.apiEndpoint}/trade/v2/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        AccountKey: account_key,
        Uic: uic,
        AssetType: "FxSpot",
        BuySell: type === "buy" ? "Buy" : "Sell",
        OrderType: order_type === "market" ? "Market"
          : order_type === "limit" ? "Limit"
            : order_type === "stop" ? "Stop"
              : order_type === "stop_limit" ? "StopLimit"
                : order_type,
        Amount: quantity,
        ...price && { OrderPrice: price },
        ...stop_limit && { StopLimitPrice: stop_limit },
        OrderRaltion: "StandAlone",
        ManualOrder: true,
        ...(order_type !== "market") && { OrderDuration: { DurationType: "GoodTillCancel" } },
      })
    })
      .then((response) => response.json())
      .then(handleError)
      .then((response) => response &&
        request(token.access_token, `/trade/v2/orders/${client_key}/${response.OrderId}`, clientConfig.apiEndpoint)
          .catch(() => getPositions(account_key)
            .then((positions) => positions.find((position) => internal(position).PositionBase.SourceOrderId === response.OrderId)))
      );
  }

  const getAccounts = async () => (await request(token.access_token, "/port/v1/accounts/me", clientConfig.apiEndpoint).catch(handleError))?.Data?.map((account: Any) => (lock({
    id: account.AccountId,
    key: account.AccountKey,
    active: account.Active,
    currency: account.Currency,
    getPositions: () => getPositions(account.AccountId),
    getBalance: () => getBalance(account.AccountKey),
    buy: createOrder.bind(null, account.AccountKey, "buy"),
    sell: createOrder.bind(null, account.AccountKey, "sell"),
    [INTERNAL]: account,
  })));

  const client: Client = lock({
    id: client_data.ClientId,
    key: client_data.ClientKey,
    name: client_data.Name,
    getAccounts,
    getPositions,
    getOrders,
    [INTERNAL]: client_data,
  });

  return client;
};