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
  getOrders(account_id?: string): Promise<Order[]>,
  /** Get net positions (aggregated positions) */
  getNetPositions(account_id?: string): Promise<Position[]>,
  /** Get closed positions */
  getClosedPositions(account_id?: string, fromDate?: Date, toDate?: Date): Promise<Position[]>,
  /** Get exposure information */
  getExposure(account_id?: string): Promise<Any>,
  /** Pre-check an order before placing it */
  preCheckOrder(order: OrderRequest): Promise<PreCheckResult>,
}

export interface Account {
  id: string,
  key: string,
  active: boolean,
  currency: string,
  getBalance(): Promise<Balance>,
  getPositions(): Promise<Position[]>,
  getOrders(): Promise<Order[]>,
  /** Place a buy order */
  buy(uic: number, quantity: number, type?: Order["order_type"], price?: number, stop_limit?: number, options?: OrderOptions): Promise<Position | Order>,
  /** Place a sell order */
  sell(uic: number, quantity: number, type?: Order["order_type"], price?: number, stop_limit?: number, options?: OrderOptions): Promise<Position | Order>,
  /** Cancel a specific order */
  cancelOrder(orderId: string): Promise<void>,
  /** Cancel all orders for a specific instrument */
  cancelAllOrders(uic: number, assetType?: AssetType): Promise<void>,
  /** Modify an existing order */
  modifyOrder(orderId: string, price?: number, quantity?: number): Promise<Order>,
}

export interface Balance {
  /** The current cash balance of the account/client. */
  cashBalance: number;
  /** The current cash available for trading in the account/client. */
  cashAvailable: number;
  /** Total portfolio value */
  totalValue: number;
  /** Sum of maintenance margin used for current positions on the account/client. */
  marginUsed: number;
  /** Margin available for opening new positions. */
  marginAvailable: number;
  /** Unrealized profit/loss */
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

export type AssetType = 
  | "FxSpot" 
  | "FxForward" 
  | "FxVanillaOption" 
  | "FxKnockInOption" 
  | "FxKnockOutOption" 
  | "FxOneTouchOption" 
  | "FxNoTouchOption" 
  | "Stock" 
  | "StockOption" 
  | "StockIndex" 
  | "StockIndexOption" 
  | "Bond" 
  | "FuturesStrategy" 
  | "FxBinaryOption" 
  | "CfdOnStock" 
  | "CfdOnIndex" 
  | "CfdOnFutures" 
  | "Etc" 
  | "Etf" 
  | "Etn" 
  | "Fund" 
  | "MutualFund";

export type OrderDuration = {
  durationType: "DayOrder" | "GoodTillCancel" | "FillOrKill" | "ImmediateOrCancel" | "GoodTillDate";
  expirationDateTime?: string; // ISO date string for GoodTillDate
};

export interface OrderOptions {
  /** Asset type (defaults to FxSpot for backward compatibility) */
  assetType?: AssetType;
  /** Order duration (defaults to GoodTillCancel for non-market orders) */
  duration?: OrderDuration;
  /** External reference for tracking */
  externalReference?: string;
  /** Whether this is a manual order */
  manualOrder?: boolean;
  /** Force open position (don't net against existing positions) */
  isForceOpen?: boolean;
  /** Trailing stop distance to market */
  trailingStopDistanceToMarket?: number;
  /** Trailing stop step size */
  trailingStopStep?: number;
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
  /** Asset type of the instrument */
  assetType?: AssetType;
  /** External reference if provided */
  externalReference?: string;
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

export interface OrderRequest {
  accountKey: string;
  uic: number;
  assetType: AssetType;
  buySell: "Buy" | "Sell";
  orderType: "Market" | "Limit" | "Stop" | "StopLimit";
  amount: number;
  orderPrice?: number;
  stopLimitPrice?: number;
  orderDuration?: OrderDuration;
  externalReference?: string;
  manualOrder?: boolean;
  isForceOpen?: boolean;
}

export interface PreCheckResult {
  /** Estimated costs for the order */
  estimatedCosts?: {
    commission?: number;
    financing?: number;
    total?: number;
  };
  /** Margin impact information */
  marginImpact?: {
    initialMargin?: number;
    maintenanceMargin?: number;
    currency?: string;
  };
  /** Error information if pre-check failed */
  errorInfo?: {
    errorCode: string;
    message: string;
  };
  /** Whether the order passed pre-check validation */
  preCheckResult?: string;
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

  const getPositions = async (account_key?: string) => {
    try {
      const result = await request(token.access_token, account_key ? `/port/v1/positions?ClientKey=${client_key}&AccountKey=${account_key}` : "/port/v1/positions/me", clientConfig.apiEndpoint).then(handleError);
      return result?.Data?.map(({ PositionId, PositionBase, PositionView }: Any) => (lock({
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
    }))) || [];
    } catch (error) {
      return [];
    }
  };

  const getOrders = async (account_key?: string) => {
    try {
      const result = await request(token.access_token, account_key ? `/port/v1/orders?ClientKey=${client_key}&AccountKey=${account_key}` : "/port/v1/orders/me", clientConfig.apiEndpoint).then(handleError);
      return result?.Data?.map((order: Any) => (lock({
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
    assetType: order.AssetType,
      [INTERNAL]: order,
    }))) || [];
    } catch (error) {
      return [];
    }
  };

  const getBalance = async (account_key: string) => await request(token.access_token, `/port/v1/balances?ClientKey=${client_key}&AccountKey=${account_key}`, clientConfig.apiEndpoint).catch(handleError).then(handleError).then((response: Any) => (lock({
    cashBalance: response.CashBalance || 0,
    cashAvailable: response.CashAvailableForTrading || 0,
    totalValue: response.TotalValue || 0,
    marginUsed: response.MarginUsedByCurrentPositions || 0,
    marginAvailable: response.MarginAvailableForTrading || 0,
    unrealizedPnL: response.UnrealizedPositionsValue || 0,
    currency: response.Currency,
    [INTERNAL]: response
  }))) as Balance;

  const createOrder = async (
    account_key: string, 
    type: Order["type"], 
    uic: number, 
    quantity: number, 
    order_type: Order["order_type"] = "market", 
    price?: number, 
    stop_limit?: number,
    options: OrderOptions = {}
  ) => {
    if (order_type === "stop" && !stop_limit) throw new Error("Stop orders require a stop limit price");
    if (order_type === "market" && (price || stop_limit)) throw new Error("Market orders cannot have a price or stop limit");
    if (["limit", "stop_limit"].includes(order_type) && !price) throw new Error("Limit orders require a price");
    if (["market", "stop", "limit", "stop_limit"].includes(order_type) === false) throw new Error("Invalid order type");
    
    const orderRequest = {
      AccountKey: account_key,
      Uic: uic,
      AssetType: options.assetType || "FxSpot",
      BuySell: type === "buy" ? "Buy" : "Sell",
      OrderType: order_type === "market" ? "Market"
        : order_type === "limit" ? "Limit"
          : order_type === "stop" ? "Stop"
            : order_type === "stop_limit" ? "StopLimit"
              : order_type,
      Amount: quantity,
      ...price && { OrderPrice: price },
      ...stop_limit && { StopLimitPrice: stop_limit },
      OrderRelation: "StandAlone",
      ManualOrder: options.manualOrder ?? true,
      ...options.externalReference && { ExternalReference: options.externalReference },
      ...options.isForceOpen && { IsForceOpen: options.isForceOpen },
      ...options.trailingStopDistanceToMarket && { TrailingStopDistanceToMarket: options.trailingStopDistanceToMarket },
      ...options.trailingStopStep && { TrailingStopStep: options.trailingStopStep },
      ...(order_type !== "market") && { 
        OrderDuration: options.duration || { DurationType: "GoodTillCancel" }
      },
    };

    const response = await fetch(`${clientConfig.apiEndpoint}/trade/v2/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderRequest)
    })
      .then((response) => response.json())
      .then(handleError);

    if (!response || !response.OrderId) {
      throw new Error("Failed to place order: No OrderId returned");
    }

    // Try to get the full order details, or fallback to check positions
    try {
      const orderDetails = await request(token.access_token, `/trade/v2/orders/${client_key}/${response.OrderId}`, clientConfig.apiEndpoint);
      if (orderDetails) return orderDetails;
    } catch (error) {
      // Order might have been executed immediately, check positions
      const positions = await getPositions(account_key);
      const position = positions?.find((pos: Position) => internal(pos).PositionBase?.SourceOrderId === response.OrderId);
      if (position) return position;
    }

    // Fallback: return a basic order object with the information we have
    return {
      id: response.OrderId,
      type: type,
      order_type: order_type,
      price: price || 0,
      quantity: quantity,
      time: new Date(),
      uic: uic,
      client_id: client_id,
      account_id: account_key,
      exchange_id: "",
      status: "working" as const,
      externalReference: options.externalReference,
      assetType: options.assetType || "FxSpot"
    } as Order;
  };

  const cancelOrder = async (account_key: string, orderId: string) => {
    return await fetch(`${clientConfig.apiEndpoint}/trade/v2/orders/${orderId}?AccountKey=${account_key}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to cancel order: ${response.statusText}`);
        return response.status === 204 ? {} : response.json();
      })
      .then(handleError);
  };

  const cancelAllOrders = async (account_key: string, uic: number, assetType: AssetType = "FxSpot") => {
    return await fetch(`${clientConfig.apiEndpoint}/trade/v2/orders?AccountKey=${account_key}&AssetType=${assetType}&Uic=${uic}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to cancel orders: ${response.statusText}`);
        return response.status === 204 ? {} : response.json();
      })
      .then(handleError);
  };

  const modifyOrder = async (account_key: string, orderId: string, price?: number, quantity?: number) => {
    // First get the current order to determine its type
    let currentOrder;
    try {
      const orders = await getOrders(account_key);
      currentOrder = orders?.find((o: any) => o.id === orderId);
      if (!currentOrder) {
        throw new Error(`Order ${orderId} not found`);
      }
    } catch (error) {
      throw new Error(`Failed to get order details: ${error}`);
    }

    const updateData: Any = {
      AccountKey: account_key,
      OrderId: orderId,
      OrderType: currentOrder.order_type === "market" ? "Market"
        : currentOrder.order_type === "limit" ? "Limit"
          : currentOrder.order_type === "stop" ? "Stop"
            : currentOrder.order_type === "stop_limit" ? "StopLimit"
              : "Limit", // Default fallback
      AssetType: currentOrder.assetType,
      Uic: currentOrder.uic,
      OrderDuration: { DurationType: "GoodTillCancel" }, // Default duration
    };
    
    if (price !== undefined) updateData.OrderPrice = price;
    if (quantity !== undefined) updateData.Amount = quantity;
    
    return await fetch(`${clientConfig.apiEndpoint}/trade/v2/orders`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData)
    })
      .then((response) => response.json())
      .then(handleError);
  };

  const getNetPositions = async (account_key?: string) => {
    const endpoint = account_key 
      ? `/port/v1/netpositions?ClientKey=${client_key}&AccountKey=${account_key}` 
      : "/port/v1/netpositions/me";
    
    try {
      const result = await request(token.access_token, endpoint, clientConfig.apiEndpoint).then(handleError);
      return result?.Data?.map((netPos: Any) => (lock({
        id: netPos.NetPositionId,
        uic: netPos.NetPositionBase.Uic,
        client_id,
        account_id: netPos.NetPositionBase.AccountId,
        order_id: "",
        status: netPos.NetPositionBase.Status,
        quantity: netPos.NetPositionBase.Amount,
        price: netPos.NetPositionBase.AverageOpenPrice,
        value: netPos.NetPositionView.MarketValue,
        currency: netPos.NetPositionView.ExposureCurrency,
        assetType: netPos.NetPositionBase.AssetType,
        [INTERNAL]: netPos,
      }))) || [];
    } catch (error) {
      return [];
    }
  };

  const getClosedPositions = async (account_key?: string, fromDate?: Date, toDate?: Date) => {
    let endpoint = account_key 
      ? `/port/v1/closedpositions?ClientKey=${client_key}&AccountKey=${account_key}` 
      : "/port/v1/closedpositions/me";
    
    if (fromDate) endpoint += `&FromDateTime=${fromDate.toISOString()}`;
    if (toDate) endpoint += `&ToDateTime=${toDate.toISOString()}`;
    
    try {
      const result = await request(token.access_token, endpoint, clientConfig.apiEndpoint).then(handleError);
      return result?.Data?.map((closedPos: Any) => (lock({
        id: closedPos.ClosedPositionId,
        uic: closedPos.PositionBase.Uic,
        client_id,
        account_id: closedPos.PositionBase.AccountId,
        order_id: closedPos.PositionBase.SourceOrderId,
        status: "closed",
        quantity: closedPos.PositionBase.Amount,
        price: closedPos.PositionBase.OpenPrice,
        value: closedPos.PositionView.ProfitLoss,
        currency: closedPos.PositionView.ExposureCurrency,
        [INTERNAL]: closedPos,
      }))) || [];
    } catch (error) {
      return [];
    }
  };

  const getExposure = async (account_key?: string) => {
    const endpoint = account_key 
      ? `/port/v1/exposure?ClientKey=${client_key}&AccountKey=${account_key}` 
      : "/port/v1/exposure/me";
    
    try {
      return await request(token.access_token, endpoint, clientConfig.apiEndpoint).then(handleError);
    } catch (error) {
      return {};
    }
  };

  const preCheckOrder = async (orderRequest: OrderRequest): Promise<PreCheckResult> => {
    const response = await fetch(`${clientConfig.apiEndpoint}/trade/v2/orders/precheck`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderRequest)
    })
      .then((response) => response.json())
      .then(handleError);

    // Transform TitleCase API response to camelCase
    const result: PreCheckResult = {};

    if (response.EstimatedCosts || response.Costs) {
      const costs = response.EstimatedCosts || response.Costs;
      result.estimatedCosts = {
        commission: costs.Commission,
        financing: costs.Financing,
        total: costs.Total || costs.TotalCosts
      };
    }

    if (response.MarginImpact) {
      result.marginImpact = {
        initialMargin: response.MarginImpact.InitialMargin,
        maintenanceMargin: response.MarginImpact.MaintenanceMargin,
        currency: response.MarginImpact.Currency
      };
    }

    if (response.ErrorInfo) {
      result.errorInfo = {
        errorCode: response.ErrorInfo.ErrorCode,
        message: response.ErrorInfo.Message
      };
    }

    if (response.PreCheckResult) {
      result.preCheckResult = response.PreCheckResult;
    }

    return result;
  };

  const getAccounts = async () => (await request(token.access_token, "/port/v1/accounts/me", clientConfig.apiEndpoint).catch(handleError))?.Data?.map((account: Any) => (lock({
    id: account.AccountId,
    key: account.AccountKey,
    active: account.Active,
    currency: account.Currency,
    getPositions: () => getPositions(account.AccountId),
    getBalance: () => getBalance(account.AccountKey),
    getOrders: () => getOrders(account.AccountKey),
    buy: createOrder.bind(null, account.AccountKey, "buy"),
    sell: createOrder.bind(null, account.AccountKey, "sell"),
    cancelOrder: (orderId: string) => cancelOrder(account.AccountKey, orderId),
    cancelAllOrders: (uic: number, assetType?: AssetType) => cancelAllOrders(account.AccountKey, uic, assetType),
    modifyOrder: (orderId: string, price?: number, quantity?: number) => modifyOrder(account.AccountKey, orderId, price, quantity),
    [INTERNAL]: account,
  })));

  const client: Client = lock({
    id: client_data.ClientId,
    key: client_data.ClientKey,
    name: client_data.Name,
    getAccounts,
    getPositions,
    getOrders,
    getNetPositions,
    getClosedPositions,
    getExposure,
    preCheckOrder,
    [INTERNAL]: client_data,
  });

  return client;
};