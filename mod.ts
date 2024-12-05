// deno-lint-ignore-file no-explicit-any
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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
  /** The account balance */
  balance: number;
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

const API_ENDPOINT = Deno.env.get("SAXOPOINT_GATEWAY") ?? "https://gateway.saxobank.com/sim/openapi";
const AUTH_ENDPOINT = Deno.env.get("SAXOPOINT_AUTH") ?? "https://sim.logonvalidation.net";

const SAXO_APP_KEY = Deno.env.get("SAXO_APP_KEY")!;
const SAXO_APP_SECRET = Deno.env.get("SAXO_APP_SECRET")!;
const SAXO_APP_REDIRECT_URI = Deno.env.get("SAXO_APP_REDIRECT_URI")!;

if (!SAXO_APP_KEY || !SAXO_APP_SECRET || !SAXO_APP_REDIRECT_URI) throw new Error("Missing environment variables, SAXO_APP_KEY, SAXO_APP_SECRET, SAXO_APP_REDIRECT_URI");

const authenticate = async (username: string, password: string): Promise<TokenResponse> => {
  const STATE = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // Step 1: Generate auth URL and fetch initial login page
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SAXO_APP_KEY,
    state: STATE,
    redirect_uri: SAXO_APP_REDIRECT_URI,
  });
  const authUrl = `${AUTH_ENDPOINT}/authorize?${params.toString()}`;
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
  const credentials = encodeBase64(`${SAXO_APP_KEY}:${SAXO_APP_SECRET}`);
  const tokenResponse = await fetch(`${AUTH_ENDPOINT}/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: SAXO_APP_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to fetch token: ${tokenResponse.statusText}`);
  }

  return await tokenResponse.json();
};

const request = async (token: string, endpoint: string, queryParams: Record<string, string | number> = {}, method: string = "GET"): Promise<any> => {
  const url = new URL(`${API_ENDPOINT}${endpoint}`);
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

const handleError = (response: any) => {
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

export const createClient = async (username: string, password: string) => {
  const token = await authenticate(username, password);

  const client_data = await request(token.access_token, "/port/v1/clients/me").then(handleError);

  const client_id = client_data.ClientId;
  const client_key = client_data.ClientKey;

  const getPositions = async (account_key?: string) => (await request(token.access_token, account_key ? `/port/v1/positions?ClientKey=${client_key}&AccountKey=${account_key}` : "/port/v1/positions/me").catch(handleError).then(handleError))?.Data?.map(({ PositionId, PositionBase, PositionView }: any) => (lock({
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

  const getOrders = async (account_key?: string) => (await request(token.access_token, account_key ? `/port/v1/orders?ClientKey=${client_key}&AccountKey=${account_key}` : "/port/v1/orders/me").catch(handleError).then(handleError))?.Data?.map((order: any) => (lock({
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

  const getBalance = async (account_key: string) => await request(token.access_token, `/port/v1/balances?ClientKey=${client_key}&AccountKey=${account_key}`).catch(handleError).then(handleError).then((response: any) => (lock({
    balance: response.CashBalance,
    currency: response.Currency,
    [INTERNAL]: response
  }))) as Balance;

  const createOrder = async (account_key: string, type: Order["type"], uic: number, quantity: number, order_type: Order["order_type"] = "market", price?: number, stop_limit?: number) => {
    if (order_type === "stop" && !stop_limit) throw new Error("Stop orders require a stop limit price");
    if (order_type === "market" && (price || stop_limit)) throw new Error("Market orders cannot have a price or stop limit");
    if (["limit", "stop_limit"].includes(order_type) && !price) throw new Error("Limit orders require a price");
    if (["market", "stop", "limit", "stop_limit"].includes(order_type) === false) throw new Error("Invalid order type");
    return await fetch(`${API_ENDPOINT}/trade/v2/orders`, {
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
        request(token.access_token, `/trade/v2/orders/${client_key}/${response.OrderId}`)
          .catch(() => getPositions(account_key)
            .then((positions) => positions.find((position) => internal(position).PositionBase.SourceOrderId === response.OrderId)))
      );
  }

  const getAccounts = async () => (await request(token.access_token, "/port/v1/accounts/me").catch(handleError))?.Data?.map((account: any) => (lock({
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