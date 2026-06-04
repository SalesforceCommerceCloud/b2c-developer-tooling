// Ambient type declarations for the SFRA `modules` cartridge.
//
// SFRA's `modules/server.js` is a thin facade that re-exports a Server
// singleton with several properties dynamically attached after construction
// (`server.middleware`, `server.forms`, `server.querystring`). TypeScript
// can't infer those property assignments through `var x = require(...); x.foo = ...; module.exports = x`,
// so cartridge code that does `require('server').middleware` reports
// TS2339 even with `checkJs: true`. These ambient declarations describe
// the public shape of the SFRA modules so cartridge code type-checks.
//
// Loaded automatically by the @salesforce/b2c-script-types TS Server plugin
// when a cartridge literally named `modules` is found in the workspace.
//
// These declarations target SFRA reference architecture as published. If you
// have customized the `modules` cartridge contents, the inferred type may
// drift from these declarations.

declare module 'server' {
  import {Server, QueryStringConstructor} from 'server/server';
  import * as middleware from 'server/middleware';
  import {ServerForms} from 'server/forms';
  // The default export of `modules/server.js` is a Server instance with
  // `middleware`, `forms`, and `querystring` attached.
  const server: Server & {
    middleware: typeof middleware;
    forms: ServerForms;
    querystring: QueryStringConstructor;
  };
  export = server;
}

declare module 'server/server' {
  /** Middleware function executed within a route chain. */
  export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

  /** Continuation passed to middleware. Pass an Error to abort the chain. */
  export type NextFunction = (err?: Error) => void;

  /**
   * Routing solution provided by the SFRA `modules` cartridge. Each call to
   * `server.use`, `server.get`, or `server.post` registers a named route with
   * a chain of middleware functions and returns the resulting Route.
   */
  export class Server {
    routes: {[name: string]: Route};

    /** Register a route with arbitrary HTTP method. */
    use(name: string, ...middleware: Middleware[]): Route;
    /** Shortcut for `use` that requires GET. */
    get(name: string, ...middleware: Middleware[]): Route;
    /** Shortcut for `use` that requires POST. */
    post(name: string, ...middleware: Middleware[]): Route;
    /** Output an object with all registered routes (consumed by SFRA controllers). */
    exports(): {[name: string]: unknown};
    /** Extend this server with the routes of another server export. */
    extend(server: {__routes?: {[name: string]: Route}}): void;
    /** Prepend middleware to an existing route. */
    prepend(name: string, ...middleware: Middleware[]): void;
    /** Append middleware to an existing route. */
    append(name: string, ...middleware: Middleware[]): void;
    /** Replace an existing route's middleware chain. */
    replace(name: string, ...middleware: Middleware[]): void;
    /** Look up a route by name. */
    getRoute(name: string): Route | undefined;
  }

  /** A registered route with an event-emitter-style API. */
  export class Route {
    name: string;
    chain: Middleware[];
    req: Request;
    res: Response;
    on(event: 'route:Start' | 'route:Step' | 'route:Redirect' | 'route:BeforeComplete' | 'route:Complete', listener: (req: Request, res: Response) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): boolean;
    /** Returns the executable function bound to this route. */
    getRoute(): (err?: {ErrorText?: string; ControllerName?: string; CurrentStartNodeName?: string}) => void;
    /** Append a middleware step to this route's chain. */
    append(step: Middleware): void;
  }

  /** Locale information attached to {@link Request.locale}. */
  export interface Locale {
    id: string;
    country: string;
    currencyCode: string;
    displayCountry: string;
    displayLanguage: string;
    displayName: string;
    ISO3Country: string;
    ISO3Language: string;
    language: string;
    name: string;
  }

  /** Local request wrapper exposed to middleware. */
  export class Request {
    httpMethod: string;
    host: string;
    path: string;
    httpHeaders: globalThis.Map<string, string>;
    https: boolean;
    includeRequest: boolean;
    readonly session: dw.system.Session;
    readonly httpParameterMap: dw.web.HttpParameterMap;
    readonly querystring: QueryStringInstance;
    readonly form: {[key: string]: unknown};
    readonly body: string | null;
    readonly geolocation: {countryCode: string; latitude: number; longitude: number} | null;
    readonly currentCustomer: {
      profile: dw.customer.Profile | null;
      addressBook: {addresses: dw.customer.CustomerAddress[]; preferredAddress: dw.customer.CustomerAddress | null} | null;
      wallet: dw.customer.Wallet | null;
      raw: dw.customer.Customer;
      authenticated: boolean;
      registered: boolean;
      credentials: {username: string} | null;
    };
    readonly locale: Locale;
    readonly remoteAddress: string;
    readonly referer: string | null;
    readonly pageMetaData: PageMetaData;
    setLocale(localeID: string): boolean;
  }

  /** Mutable page metadata accessor on {@link Request.pageMetaData}. */
  export interface PageMetaData {
    title?: string;
    description?: string;
    keywords?: string;
    pageMetaTags: dw.web.PageMetaTag[];
    addPageMetaTags(pageMetaTags: dw.web.PageMetaTag[]): void;
    setTitle(title: string): void;
    setDescription(description: string): void;
    setKeywords(keywords: string): void;
  }

  /** Local response wrapper exposed to middleware. */
  export class Response {
    view: string | null;
    viewData: {[key: string]: unknown};
    redirectUrl: string | null;
    redirectStatus: number | null;
    messageLog: string[];
    base: dw.system.Response;
    cachePeriod: number | null;
    cachePeriodUnit: 'hours' | 'minutes' | null;
    personalized: boolean;
    renderings: Array<{type: string; subType?: string; view?: string; page?: string; aspectAttributes?: dw.util.HashMap<unknown, unknown>; message?: string}>;
    isJson?: boolean;
    isXml?: boolean;
    /** Schedule an ISML template render. */
    render(name: string, data?: {[key: string]: unknown}): void;
    /** Schedule a JSON render with the supplied data. */
    json(data: {[key: string]: unknown}): void;
    /** Schedule an XML render with the supplied string. */
    xml(xmlString: string): void;
    /** Schedule a Page Designer page render. */
    page(page: string, data?: {[key: string]: unknown}, aspectAttributes?: dw.util.HashMap<unknown, unknown>): void;
    /** Schedule a redirect after the chain completes. */
    redirect(url: string): void;
    /** HTTP status code for a redirect (e.g. 301, 302). */
    setRedirectStatus(redirectStatus: number): void;
    /** Get the accumulated view data. */
    getViewData(): {[key: string]: unknown};
    /** Merge data into the view data. */
    setViewData(data: {[key: string]: unknown}): void;
    /** Append entries to the error-page log. */
    log(...args: unknown[]): void;
    /** Set the response Content-Type header. */
    setContentType(type: string): void;
    /** Set the HTTP status code. */
    setStatusCode(code: number): void;
    /** Append a literal string to the rendered output. */
    print(message: string): void;
    /** Set page cache expiration period (default unit is hours). */
    cacheExpiration(period: number): void;
    /** Set an arbitrary HTTP response header. */
    setHttpHeader(name: string, value: string): void;
  }

  /**
   * Constructor function exposed at `server.querystring`. Parses raw query
   * strings, including SFRA-specific dwvar/dwopt/preferences encodings.
   * Each enumerable own-property of an instance is a query-string parameter
   * (or one of the structured fields below).
   */
  export interface QueryStringInstance {
    [key: string]: unknown;
    variables?: {[key: string]: {id: string; value: string}};
    options?: Array<{optionId: string; selectedValueId: string; productId: string}>;
    preferences?: {[key: string]: string | {min: string; max: string}};
    toString(): string;
  }
  export interface QueryStringConstructor {
    new (raw: string): QueryStringInstance;
  }
  export const QueryString: QueryStringConstructor;
}

declare module 'server/middleware' {
  import {Middleware} from 'server/server';
  /** Reject the request if not a GET. */
  export const get: Middleware;
  /** Reject the request if not a POST. */
  export const post: Middleware;
  /** Reject the request if not over HTTPS. */
  export const https: Middleware;
  /** Reject the request if over HTTPS. */
  export const http: Middleware;
  /** Reject the request unless it is a remote include. */
  export const include: Middleware;
}

declare module 'server/render' {
  import {Response} from 'server/server';
  /** Walk a Response's queued `renderings` and emit them. */
  export function applyRenderings(res: Response): void;
}

declare module 'server/route' {
  import {Route} from 'server/server';
  export = Route;
}

declare module 'server/request' {
  import {Request} from 'server/server';
  export = Request;
}

declare module 'server/response' {
  import {Response} from 'server/server';
  export = Response;
}

declare module 'server/queryString' {
  import {QueryStringConstructor} from 'server/server';
  const QueryString: QueryStringConstructor;
  export = QueryString;
}

declare module 'server/forms' {
  /** Result of `server.forms.getForm(name)` — a parsed dw.web.Form/FormGroup. */
  export interface SfraForm {
    valid: boolean;
    htmlName: string;
    dynamicHtmlName: string;
    error: string | null;
    attributes: string;
    formType: 'formGroup';
    base: dw.web.Form | dw.web.FormGroup;
    [key: string]: unknown;
    /** Reset the underlying form and refresh this object from it. */
    clear(): void;
    /** Copy values from a plain object into this form (and the underlying form). */
    copyFrom(object: {[key: string]: unknown}): void;
    /** Convert this form back to a plain JS object of field values. */
    toObject(): {[key: string]: unknown};
  }
  export interface ServerForms {
    /** Look up a form by name (e.g. `'profile'`, `'addressBook'`). */
    getForm(name: string): SfraForm;
  }
}

declare module 'server/forms/forms' {
  import {ServerForms} from 'server/forms';
  /** Factory invoked with the global `session` to produce the forms helper. */
  function forms(session: dw.system.Session): ServerForms;
  export = forms;
}
