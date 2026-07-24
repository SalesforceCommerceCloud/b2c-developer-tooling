# B2C Grafana Plugin — Rate-Limit & Caching Resilience Plan

_Generated from a research+audit+verify workflow (2026-07-14). OSS-only; Enterprise features flagged._

1. **Define `HTTPError` type** in new file `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/metrics/errors.go`:

   ```go
   package metrics
   
   import (
       "fmt"
       "net/http"
       "strconv"
       "time"
   )
   
   type HTTPError struct {
       StatusCode int
       Body       string
       RetryAfter time.Duration // 0 if no Retry-After header
   }
   
   func (e *HTTPError) Error() string {
       if e.RetryAfter > 0 {
           return fmt.Sprintf("HTTP %d: %s (retry after %s)", e.StatusCode, e.Body, e.RetryAfter)
       }
       return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.Body)
   }
   
   func (e *HTTPError) IsRetryable() bool {
       return e.StatusCode == http.StatusTooManyRequests || // 429
              (e.StatusCode >= 500 && e.StatusCode < 600) || // 5xx
              e.StatusCode == http.StatusRequestTimeout       // 408
   }
   
   func (e *HTTPError) IsPermanent() bool {
       switch e.StatusCode {
       case http.StatusBadRequest,        // 400
            http.StatusUnauthorized,      // 401
            http.StatusForbidden,         // 403
            http.StatusNotFound:          // 404
           return true
       }
       return false
   }
   
   // ParseRetryAfter extracts Retry-After header (seconds or HTTP-date).
   func ParseRetryAfter(header string) time.Duration {
       if header == "" {
           return 0
       }
       // Try integer seconds first
       if seconds, err := strconv.Atoi(header); err == nil && seconds > 0 {
           return time.Duration(seconds) * time.Second
       }
       // Try HTTP-date (RFC 7231 sec 7.1.3)
       if t, err := http.ParseTime(header); err == nil {
           return time.Until(t)
       }
       return 0
   }
   ```

2. **Update `getMetrics` method** in `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/metrics/client.go` (line ~139):

   ```go
   // Replace:
   if resp.StatusCode != http.StatusOK {
       body, _ := io.ReadAll(resp.Body)
       return nil, fmt.Errorf("metrics API error (status %d): %s", resp.StatusCode, string(body))
   }
   
   // With:
   if resp.StatusCode != http.StatusOK {
       body, _ := io.ReadAll(resp.Body)
       retryAfter := ParseRetryAfter(resp.Header.Get("Retry-After"))
       return nil, &HTTPError{
           StatusCode: resp.StatusCode,
           Body:       string(body),
           RetryAfter: retryAfter,
       }
   }
   ```

**Files changed:**
- New: `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/metrics/errors.go`
- Modified: `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/metrics/client.go` (`getMetrics` method)

**Effort:** 1–2 hours

---

### 3.2 Retry with Backoff (Metrics Client)

**What:** Wrap `getMetrics` in `cenkalti/backoff/v4.RetryWithData` with exponential backoff + Retry-After honor.

**Why:** Transient errors (429, 5xx, timeouts) should retry automatically; current code fails immediately.

**Implementation:**

1. **Add retry wrapper** in `client.go` (new helper function):

   ```go
   import (
       "github.com/cenkalti/backoff/v4"
   )
   
   func (c *Client) getMetricsWithRetry(ctx context.Context, category string, window metricsops.ResolvedMetricsWindow, filters map[string]string) (*MetricsDataResponse, error) {
       // Configure backoff
       b := backoff.NewExponentialBackOff()
       b.InitialInterval = 1 * time.Second
       b.MaxInterval = 30 * time.Second
       b.MaxElapsedTime = 2 * time.Minute
       bCtx := backoff.WithContext(b, ctx)
       
       operation := func() (*MetricsDataResponse, error) {
           resp, err := c.getMetrics(ctx, category, window, filters)
           
           if err == nil {
               return resp, nil // success
           }
           
           var httpErr *HTTPError
           if errors.As(err, &httpErr) {
               if httpErr.IsPermanent() {
                   return nil, backoff.Permanent(err) // stop immediately
               }
               if httpErr.IsRetryable() {
                   // Honor Retry-After by sleeping before returning error
                   if httpErr.RetryAfter > 0 {
                       select {
                       case <-time.After(httpErr.RetryAfter):
                       case <-ctx.Done():
                           return nil, backoff.Permanent(ctx.Err())
                       }
                   }
                   return nil, err // retry with backoff
               }
               return nil, backoff.Permanent(err) // unknown status, don't retry
           }
           
           // Network errors (timeout, connection refused) → retry
           return nil, err
       }
       
       return backoff.RetryWithData(operation, bCtx)
   }
   ```

2. **Update public methods** (`GetOrderMetrics`, `GetSiteMetrics`, `GetSystemMetrics`) to call `getMetricsWithRetry` instead of `getMetrics`.

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/metrics/client.go` (add `getMetricsWithRetry`, update `Get*Metrics`)

**Effort:** 2–3 hours

---

### 3.3 Error Source + Status Mapping (Datasource Backend)

**What:** Map `HTTPError` → `backend.ErrDataResponseWithSource(backend.StatusTooManyRequests, backend.ErrorSourceDownstream, msg)` in QueryData.

**Why:** Current code uses `backend.ErrDataResponse(backend.StatusInternal, ...)` for ALL errors—Grafana treats 429s as plugin bugs, not API rate limits.

**Implementation:**

1. **Add error mapping helper** in `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go`:

   ```go
   import (
       "errors"
       "github.com/grafana/grafana-plugin-sdk-go/backend"
       metricsClient "github.com/salesforce/b2c-tooling-sdk-go/clients/metrics"
   )
   
   func mapMetricsErrorToDataResponse(err error) backend.DataResponse {
       var httpErr *metricsClient.HTTPError
       if errors.As(err, &httpErr) {
           var status backend.Status
           switch httpErr.StatusCode {
           case 429:
               status = backend.StatusTooManyRequests
           case 400:
               status = backend.StatusBadRequest
           case 401:
               status = backend.StatusUnauthorized
           case 403:
               status = backend.StatusForbidden
           case 404:
               status = backend.StatusNotFound
           case 408:
               status = backend.StatusTimeout
           case 502, 503, 504:
               status = backend.StatusBadGateway
           default:
               if httpErr.StatusCode >= 500 {
                   status = backend.StatusBadGateway
               } else {
                   status = backend.StatusInternal
               }
           }
           
           source := backend.ErrorSourceFromHTTPStatus(httpErr.StatusCode)
           return backend.ErrDataResponseWithSource(status, source, httpErr.Error())
       }
       
       // Non-HTTP errors (network, context cancellation)
       return backend.ErrDataResponseWithSource(
           backend.StatusInternal,
           backend.ErrorSourceDownstream,
           err.Error(),
       )
   }
   ```

2. **Update QueryData error handling** (line ~223):

   ```go
   // Replace:
   response.Responses[qm.RefID] = backend.ErrDataResponse(
       backend.StatusInternal,
       fmt.Sprintf("metrics API error: %v", err),
   )
   
   // With:
   response.Responses[qm.RefID] = mapMetricsErrorToDataResponse(err)
   ```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go` (add `mapMetricsErrorToDataResponse`, update QueryData lines 198-234)

**Effort:** 1–2 hours

---

### 3.4 Discovery Probe Caching (Highest ROI)

**What:** Cache `probeCategory` results (5–15min TTL) keyed by `(datasourceUID, category, tenantId)`.

**Why:** Current code fires live 24-hour probes on EVERY query editor interaction (`/metrics`, `/label-keys`, `/label-values`). A single user editing a dashboard can trigger 50+ probes in 2 minutes.

**Implementation:**

1. **Add cache to datasource struct** (line ~31 in `datasource.go`):

   ```go
   import (
       gocache "github.com/patrickmn/go-cache"
   )
   
   type MetricsDatasource struct {
       clientCache   map[string]*metrics.Client
       cacheLock     sync.RWMutex
       probeCache    *gocache.Cache           // NEW
       settings      backend.DataSourceInstanceSettings
   }
   
   func newMetricsDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
       return &MetricsDatasource{
           clientCache: make(map[string]*metrics.Client),
           probeCache:  gocache.New(10*time.Minute, 15*time.Minute), // 10min TTL, 15min cleanup
           settings:    settings,
       }, nil
   }
   ```

2. **Wrap `probeCategory` with cache** (new helper function):

   ```go
   func (d *MetricsDatasource) probeCategoryWithCache(ctx context.Context, category string, client *metrics.Client, tenantID string) (*metricsops.CategoryProbe, error) {
       // Cache key: datasourceUID + category + tenantID
       cacheKey := fmt.Sprintf("%s:%s:%s", d.settings.UID, category, tenantID)
       
       // Check cache
       if cached, found := d.probeCache.Get(cacheKey); found {
           return cached.(*metricsops.CategoryProbe), nil
       }
       
       // Cache miss — probe API
       probe, err := probeCategory(ctx, category, client)
       if err != nil {
           // On error, return stale cache if available (graceful degradation)
           if cached, found := d.probeCache.Get(cacheKey); found {
               backend.Logger.Warn("probe failed, returning stale cache", "category", category, "error", err)
               return cached.(*metricsops.CategoryProbe), nil
           }
           return nil, err
       }
       
       // Cache successful probe
       d.probeCache.Set(cacheKey, probe, gocache.DefaultExpiration)
       return probe, nil
   }
   ```

3. **Update CallResource handlers** (lines 618, 620, 622):

   ```go
   // In handleGetMetrics, handleLabelKeys, handleLabelValues:
   // Replace:
   probe, err := probeCategory(ctx, category, client)
   
   // With:
   probe, err := d.probeCategoryWithCache(ctx, category, client, tenantID)
   ```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go` (add `probeCache` field, `probeCategoryWithCache`, update CallResource handlers)

**Dependencies:** Add `github.com/patrickmn/go-cache` to `go.mod`:

```bash
cd /Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource
go get github.com/patrickmn/go-cache@v2.1.0+incompatible
```

**Effort:** 3–4 hours

**Expected impact:** 80–95% reduction in discovery API calls (from N calls per editor interaction to 1 call per 10min per category).

---

### 3.5 CheckHealth Retry + Cache Fallback

**What:** Wrap health probe in retry; cache last successful result (5min TTL); return cached OK if recent success.

**Why:** Health checks fire on every Save & Test. If a transient 429 occurs, datasource appears broken in UI.

**Implementation:**

1. **Add health cache field** to datasource struct:

   ```go
   type MetricsDatasource struct {
       clientCache   map[string]*metrics.Client
       cacheLock     sync.RWMutex
       probeCache    *gocache.Cache
       healthCache   *gocache.Cache // NEW (separate cache for health results)
       settings      backend.DataSourceInstanceSettings
   }
   
   func newMetricsDatasource(...) {
       return &MetricsDatasource{
           clientCache: make(map[string]*metrics.Client),
           probeCache:  gocache.New(10*time.Minute, 15*time.Minute),
           healthCache: gocache.New(5*time.Minute, 10*time.Minute), // 5min TTL
           settings:    settings,
       }, nil
   }
   ```

2. **Update `CheckHealth` method** (line ~537):

   ```go
   func (d *MetricsDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
       cacheKey := fmt.Sprintf("health:%s", d.settings.UID)
       
       // Try health probe with retry
       var lastErr error
       for attempt := 0; attempt < 3; attempt++ {
           client, err := d.getMetricsClient(ctx, req.PluginContext)
           if err != nil {
               lastErr = err
               time.Sleep(time.Duration(attempt+1) * time.Second) // simple backoff
               continue
           }
           
           // Probe with 5min window (lightweight check)
           window, _ := metricsops.ResolveMetricsWindow(
               metricsops.MetricsWindowInput{Window: "5m"},
               time.Now(),
           )
           _, err = client.GetSystemMetrics(ctx, window, nil)
           
           if err == nil {
               // Success — cache and return
               result := &backend.CheckHealthResult{
                   Status:  backend.HealthStatusOk,
                   Message: "Metrics API is reachable",
               }
               d.healthCache.Set(cacheKey, result, gocache.DefaultExpiration)
               return result, nil
           }
           
           var httpErr *metrics.HTTPError
           if errors.As(err, &httpErr) && !httpErr.IsRetryable() {
               // Permanent error (401, 403) — fail immediately
               return &backend.CheckHealthResult{
                   Status:  backend.HealthStatusError,
                   Message: fmt.Sprintf("Authentication failed: %v", err),
               }, nil
           }
           
           lastErr = err
           time.Sleep(time.Duration(attempt+1) * time.Second)
       }
       
       // All retries failed — check cache for graceful degradation
       if cached, found := d.healthCache.Get(cacheKey); found {
           backend.Logger.Warn("health probe failed, returning cached OK", "error", lastErr)
           return cached.(*backend.CheckHealthResult), nil
       }
       
       // No cache, all retries failed
       return &backend.CheckHealthResult{
           Status:  backend.HealthStatusError,
           Message: fmt.Sprintf("Health check failed after retries: %v", lastErr),
       }, nil
   }
   ```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go` (add `healthCache`, update `CheckHealth`)

**Effort:** 1–2 hours

---

## 4. Tier 2 — Strong Wins (Post-Tier-1)

### 4.1 QueryData Response Caching

**What:** TTL cache keyed by `hash(category, filters, roundedFrom, roundedTo, tenantId)`.

**Why:** Dashboard auto-refresh fires identical queries every N seconds. Cache avoids redundant API calls.

**Implementation:**

1. **Add query cache field**:

   ```go
   type MetricsDatasource struct {
       clientCache   map[string]*metrics.Client
       cacheLock     sync.RWMutex
       probeCache    *gocache.Cache
       healthCache   *gocache.Cache
       queryCache    *gocache.Cache // NEW
       settings      backend.DataSourceInstanceSettings
   }
   
   func newMetricsDatasource(...) {
       return &MetricsDatasource{
           // ...
           queryCache: gocache.New(2*time.Minute, 5*time.Minute), // 2min TTL
           // ...
       }
   }
   ```

2. **Add cache key builder**:

   ```go
   import "crypto/sha256"
   
   func buildQueryCacheKey(datasourceUID, category string, from, to time.Time, filters map[string]string, tenantID string) string {
       // Round time range to 1min buckets for better cache hit rate
       roundedFrom := from.Truncate(1 * time.Minute)
       roundedTo := to.Truncate(1 * time.Minute)
       
       // Serialize filters (sorted keys for stability)
       keys := make([]string, 0, len(filters))
       for k := range filters {
           keys = append(keys, k)
       }
       sort.Strings(keys)
       var filterStr string
       for _, k := range keys {
           filterStr += fmt.Sprintf("%s=%s;", k, filters[k])
       }
       
       raw := fmt.Sprintf("%s:%s:%d:%d:%s:%s",
           datasourceUID, category, roundedFrom.Unix(), roundedTo.Unix(), filterStr, tenantID)
       hash := sha256.Sum256([]byte(raw))
       return fmt.Sprintf("%x", hash[:16]) // first 16 bytes
   }
   ```

3. **Wrap GetXMetrics calls** in QueryData (lines 198-217):

   ```go
   cacheKey := buildQueryCacheKey(d.settings.UID, qm.Category, from, to, qm.Filters, tenantID)
   
   // Check cache
   if cached, found := d.queryCache.Get(cacheKey); found {
       response.Responses[qm.RefID] = cached.(backend.DataResponse)
       continue
   }
   
   // Cache miss — fetch from API
   var dataResponse *metrics.MetricsDataResponse
   var err error
   switch qm.Category {
   case "orders":
       dataResponse, err = client.GetOrderMetrics(ctx, window, qm.Filters)
   // ... other categories
   }
   
   if err != nil {
       errResp := mapMetricsErrorToDataResponse(err)
       response.Responses[qm.RefID] = errResp
       // Do NOT cache errors (only successful responses)
       continue
   }
   
   frames := dataResponse.ToFrames()
   dataResp := backend.DataResponse{Frames: frames}
   response.Responses[qm.RefID] = dataResp
   
   // Cache successful response
   d.queryCache.Set(cacheKey, dataResp, gocache.DefaultExpiration)
   ```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go` (add `queryCache`, `buildQueryCacheKey`, update QueryData)

**Effort:** 4–6 hours

**Expected impact:** 50–80% reduction in QueryData API calls for dashboards with refresh intervals shorter than cache TTL.

---

### 4.2 Singleflight Request Coalescing

**What:** Use `golang.org/x/sync/singleflight.Group` to collapse concurrent identical panel queries.

**Why:** Dashboard refresh fires all panel queries concurrently. If 5 panels query the same data, singleflight reduces 5 calls → 1 call.

**Implementation:**

1. **Add singleflight group**:

   ```go
   import "golang.org/x/sync/singleflight"
   
   type MetricsDatasource struct {
       clientCache     map[string]*metrics.Client
       cacheLock       sync.RWMutex
       probeCache      *gocache.Cache
       healthCache     *gocache.Cache
       queryCache      *gocache.Cache
       singleflightGroup singleflight.Group // NEW
       settings        backend.DataSourceInstanceSettings
   }
   ```

2. **Wrap GetXMetrics with singleflight**:

   ```go
   sfKey := buildQueryCacheKey(d.settings.UID, qm.Category, from, to, qm.Filters, tenantID)
   
   result, err, shared := d.singleflightGroup.Do(sfKey, func() (interface{}, error) {
       // Check cache inside singleflight (cache-aside pattern)
       if cached, found := d.queryCache.Get(sfKey); found {
           return cached.(backend.DataResponse), nil
       }
       
       // Cache miss — fetch from API
       var dataResponse *metrics.MetricsDataResponse
       var apiErr error
       switch qm.Category {
       case "orders":
           dataResponse, apiErr = client.GetOrderMetrics(ctx, window, qm.Filters)
       // ...
       }
       
       if apiErr != nil {
           return mapMetricsErrorToDataResponse(apiErr), nil
       }
       
       frames := dataResponse.ToFrames()
       dataResp := backend.DataResponse{Frames: frames}
       d.queryCache.Set(sfKey, dataResp, gocache.DefaultExpiration)
       return dataResp, nil
   })
   
   if err != nil {
       response.Responses[qm.RefID] = mapMetricsErrorToDataResponse(err)
   } else {
       response.Responses[qm.RefID] = result.(backend.DataResponse)
       if shared {
           backend.Logger.Debug("query coalesced via singleflight", "refID", qm.RefID)
       }
   }
   ```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go` (add `singleflightGroup`, wrap QueryData calls)

**Dependencies:** `golang.org/x/sync` (already present as transitive dep).

**Effort:** 2–3 hours

**Expected impact:** 50–90% reduction in concurrent duplicate queries (dashboard refresh with identical panel queries).

---

### 4.3 CIP Schema Caching

**What:** Cache `ListTables`, `DescribeColumns`, `Sites` results (15–30min TTL).

**Why:** Query editor dropdowns call these on every refresh; schema changes rarely.

**Implementation:**

1. **Add schema cache to CIP datasource**:

   ```go
   // In /Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/cip/plugin/datasource.go
   
   type CIPDatasource struct {
       clientCache map[string]*cip.Client
       cacheLock   sync.RWMutex
       schemaCache *gocache.Cache // NEW
       settings    backend.DataSourceInstanceSettings
   }
   
   func newCIPDatasource(...) {
       return &CIPDatasource{
           clientCache: make(map[string]*cip.Client),
           schemaCache: gocache.New(20*time.Minute, 30*time.Minute), // 20min TTL
           settings:    settings,
       }, nil
   }
   ```

2. **Wrap CallResource handlers** (lines 209, 215, 222):

   ```go
   func (d *CIPDatasource) handleListTables(ctx context.Context, client *cip.Client, tenantID string) ([]byte, error) {
       cacheKey := fmt.Sprintf("tables:%s:%s", d.settings.UID, tenantID)
       
       if cached, found := d.schemaCache.Get(cacheKey); found {
           return cached.([]byte), nil
       }
       
       tables, err := client.ListTables(ctx)
       if err != nil {
           return nil, err
       }
       
       data, _ := json.Marshal(tables)
       d.schemaCache.Set(cacheKey, data, gocache.DefaultExpiration)
       return data, nil
   }
   
   // Similar for handleDescribeColumns, handleListSites
   ```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/cip/plugin/datasource.go` (add `schemaCache`, wrap CallResource handlers)

**Effort:** 2–3 hours

---

### 4.4 Dashboard Refresh Guidance (Documentation)

**What:** Document min refresh interval, maxDataPoints impact, provide rate-limit-friendly templates.

**Where:** `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/README.md` + docs site.

**Content:**

```markdown
## Rate Limit Best Practices

The Salesforce B2C Commerce APIs have tight rate limits. Follow these guidelines:

1. **Min Refresh Interval:** Set dashboard auto-refresh to **5–10 minutes minimum**.
   - High-frequency refreshes (< 1min) will hit rate limits quickly.
   - For real-time monitoring, use Grafana Enterprise streaming or increase cache TTL.

2. **Max Data Points:** Keep default (1000) unless you need higher resolution.
   - Higher maxDataPoints → more frequent API calls (wider time ranges get coarser intervals).

3. **Query Time Ranges:** Use relative time ranges (e.g., "Last 1 hour", "Last 24 hours") instead of absolute.
   - Relative ranges with rounded timestamps improve cache hit rates.

4. **Panel Queries:** Avoid duplicate queries across panels.
   - Use dashboard variables for shared filters (site, tenant).
   - Leverage panel transformations instead of separate queries.

5. **Discovery Probes:** Query editor dropdowns are cached (10min TTL).
   - If dropdowns appear stale, wait or refresh datasource config.

6. **429 Rate Limit Errors:** Orange "Rate limited" badge on panel.
   - Plugin automatically retries with exponential backoff (up to 2min).
   - If persistent, reduce dashboard refresh rate or narrow time window.
```

**Effort:** 1–2 hours

---

## 5. Tier 3 — Nice to Have / Enterprise

- **Grafana Enterprise Query Caching** (admin-configured, server-side): NOT available in OSS. If using Enterprise/Cloud, enable via datasource settings UI (cache TTL, per-query cache keys).
- **Streaming / Incremental Updates**: Grafana Live for real-time data push. Requires backend streaming support (WebSocket/SSE). Not currently supported by B2C Metrics API.
- **Connection Pooling Tuning**: CIP already maxed at `MaxOpenConns=1` due to sticky-session requirement (x-session-id affinity). Metrics client uses default `http.Client` connection pool (100 conns max, 90s idle timeout).

---

## 6. CIP vs Metrics Differences

| Aspect | Metrics (HTTP/REST) | CIP (database/sql + Avatica) |
|--------|---------------------|------------------------------|
| **Error Detection** | Parse `resp.StatusCode`; extract Retry-After header | Errors opaque (no HTTP status); detect timeout/connection by text matching (`strings.Contains(err.Error(), "timeout")`) |
| **Retry Middleware** | Can use `http.RoundTripper` middleware for transport-level retry | Must retry at `Query`/`Exec` call site; wrap `db.QueryContext` in backoff loop |
| **Retry Config** | `InitialInterval=1s`, `MaxElapsedTime=2min`, retry 429/5xx/timeout | `InitialInterval=500ms`, `MaxElapsedTime=30s` (lower—synchronous SQL); retry timeout/connection errors only |
| **Caching** | Cache QueryData responses (time-series) + discovery probes (categories/labels) | Cache schema only (ListTables, DescribeColumns, Sites); do NOT cache QueryData (user-defined WHERE clauses vary) |
| **Sticky Session** | N/A (stateless REST) | `x-session-id` echo transport required; `MaxOpenConns=1` ensures one conn per backend; retry must preserve session OR re-establish |
| **Error Source** | Map `HTTPError.StatusCode` → `backend.StatusTooManyRequests` + `ErrorSourceDownstream` | All errors → `backend.StatusInternal` + `ErrorSourceDownstream` (can't extract HTTP status); classify by error text |

### CIP-Specific Retry Implementation

```go
// In /Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/cip/client.go

func (c *Client) QueryWithRetry(ctx context.Context, query string) (*sql.Rows, error) {
    b := backoff.NewExponentialBackOff()
    b.InitialInterval = 500 * time.Millisecond
    b.MaxInterval = 10 * time.Second
    b.MaxElapsedTime = 30 * time.Second
    bCtx := backoff.WithContext(b, ctx)
    
    operation := func() (*sql.Rows, error) {
        rows, err := c.db.QueryContext(ctx, query)
        if err == nil {
            return rows, nil
        }
        
        errStr := err.Error()
        // Detect retryable errors (timeout, connection)
        if strings.Contains(errStr, "timeout") ||
           strings.Contains(errStr, "connection") ||
           strings.Contains(errStr, "i/o timeout") {
            return nil, err // retry
        }
        
        // Detect permanent errors (auth, SQL syntax)
        if strings.Contains(errStr, "unauthorized") ||
           strings.Contains(errStr, "forbidden") ||
           strings.Contains(errStr, "syntax error") {
            return nil, backoff.Permanent(err)
        }
        
        // Unknown error — don't retry
        return nil, backoff.Permanent(err)
    }
    
    return backoff.RetryWithData(operation, bCtx)
}
```

**Files changed:**
- `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/cip/client.go` (add `QueryWithRetry`, update `Query`/`ListTables`/`DescribeColumns` to call it)

**Effort:** 2–3 hours

---

## 7. Recommended Shared Abstraction

**Where:** New package `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/resilience`

**Why:** Both Metrics and CIP need retry+backoff; discovery and schema endpoints need caching. Centralize logic for testability and consistency.

### Interface Sketch

```go
package resilience

import (
    "context"
    "time"
    
    "github.com/cenkalti/backoff/v4"
    gocache "github.com/patrickmn/go-cache"
    "golang.org/x/sync/singleflight"
)

// Config holds resilience settings.
type Config struct {
    EnableRetry        bool
    MaxRetries         int
    InitialBackoff     time.Duration
    MaxBackoff         time.Duration
    MaxElapsedTime     time.Duration
    EnableCache        bool
    CacheTTL           time.Duration
    EnableSingleflight bool
}

// RetryableError wraps an error with retry/permanent classification.
type RetryableError interface {
    error
    IsRetryable() bool
    IsPermanent() bool
    RetryAfter() time.Duration // 0 if no hint
}

// WithRetry wraps an operation with exponential backoff + Retry-After honor.
func WithRetry[T any](ctx context.Context, cfg Config, operation func(context.Context) (T, error)) (T, error) {
    if !cfg.EnableRetry {
        return operation(ctx)
    }
    
    b := backoff.NewExponentialBackOff()
    b.InitialInterval = cfg.InitialBackoff
    b.MaxInterval = cfg.MaxBackoff
    b.MaxElapsedTime = cfg.MaxElapsedTime
    bCtx := backoff.WithContext(b, ctx)
    
    retryOp := func() (T, error) {
        result, err := operation(ctx)
        if err == nil {
            return result, nil
        }
        
        if retryableErr, ok := err.(RetryableError); ok {
            if retryableErr.IsPermanent() {
                return result, backoff.Permanent(err)
            }
            if retryableErr.IsRetryable() {
                // Honor Retry-After
                if delay := retryableErr.RetryAfter(); delay > 0 {
                    time.Sleep(delay)
                }
                return result, err // retry
            }
        }
        
        // Unknown error — don't retry
        var zero T
        return zero, backoff.Permanent(err)
    }
    
    return backoff.RetryWithData(retryOp, bCtx)
}

// WithCache wraps an operation with TTL caching.
func WithCache[T any](cache *gocache.Cache, key string, ttl time.Duration, operation func() (T, error)) (T, error) {
    if cache == nil {
        return operation()
    }
    
    // Check cache
    if cached, found := cache.Get(key); found {
        return cached.(T), nil
    }
    
    // Cache miss — execute operation
    result, err := operation()
    if err != nil {
        // On error, check if stale cache exists (graceful degradation)
        if cached, found := cache.Get(key); found {
            return cached.(T), nil
        }
        var zero T
        return zero, err
    }
    
    // Cache successful result
    cache.Set(key, result, ttl)
    return result, nil
}

// WithSingleflight wraps an operation with request coalescing.
func WithSingleflight[T any](group *singleflight.Group, key string, operation func() (T, error)) (T, error) {
    result, err, _ := group.Do(key, func() (interface{}, error) {
        return operation()
    })
    if err != nil {
        var zero T
        return zero, err
    }
    return result.(T), nil
}
```

### Usage in Metrics Client

```go
// In /Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/clients/metrics/client.go

import "github.com/salesforce/b2c-tooling-sdk-go/resilience"

func (c *Client) getMetricsWithResilience(ctx context.Context, category string, window metricsops.ResolvedMetricsWindow, filters map[string]string) (*MetricsDataResponse, error) {
    cfg := resilience.Config{
        EnableRetry:    true,
        InitialBackoff: 1 * time.Second,
        MaxBackoff:     30 * time.Second,
        MaxElapsedTime: 2 * time.Minute,
    }
    
    return resilience.WithRetry(ctx, cfg, func(ctx context.Context) (*MetricsDataResponse, error) {
        return c.getMetrics(ctx, category, window, filters)
    })
}
```

### Usage in Datasource Backend (with Cache + Singleflight)

```go
// In /Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/pkg/plugin/datasource.go

probe, err := resilience.WithSingleflight(d.singleflightGroup, cacheKey, func() (*metricsops.CategoryProbe, error) {
    return resilience.WithCache(d.probeCache, cacheKey, 10*time.Minute, func() (*metricsops.CategoryProbe, error) {
        return probeCategory(ctx, category, client)
    })
})
```

**Files changed:**
- New package: `/Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-tooling-sdk-go/resilience/resilience.go`
- Update: `clients/metrics/client.go`, `clients/cip/client.go`, `pkg/plugin/datasource.go`, `pkg/cip/plugin/datasource.go`

**Effort:** 6–8 hours (includes tests for retry logic, cache eviction, singleflight deduplication)

**Benefits:**
- ✅ Both Metrics and CIP clients use same retry logic
- ✅ Testable: mock operation func, verify retry count, backoff delays
- ✅ Consistent error handling (RetryableError interface)
- ✅ Easy to add circuit-breaker later (extend Config)

---

## 8. Sequenced Implementation Checklist

**Each item is independently shippable + verifiable against live bdpx_prd.**

### Phase 1: Error Visibility (1–2 days)

- [ ] 1. **Define `HTTPError` type** in `b2c-tooling-sdk-go/clients/metrics/errors.go`
  - Fields: `StatusCode`, `Body`, `RetryAfter`
  - Methods: `Error()`, `IsRetryable()`, `IsPermanent()`
  - Helper: `ParseRetryAfter(header string) time.Duration`
  - **Verify:** Unit test parsing `Retry-After: 30` and `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT`

- [ ] 2. **Update `getMetrics` to return `HTTPError`** in `clients/metrics/client.go`
  - Parse `resp.StatusCode`, extract `Retry-After` header
  - Replace `fmt.Errorf(...)` with `&HTTPError{...}`
  - **Verify:** Integration test against mock server returning 429 + Retry-After header; assert error type and RetryAfter value

- [ ] 3. **Add `mapMetricsErrorToDataResponse` helper** in `pkg/plugin/datasource.go`
  - Map `HTTPError.StatusCode` → `backend.StatusTooManyRequests`, `StatusBadGateway`, etc.
  - Use `backend.ErrorSourceFromHTTPStatus(statusCode)` for source attribution
  - Return `backend.ErrDataResponseWithSource(...)`
  - **Verify:** Unit test with mock HTTPError{StatusCode: 429}; assert result has Status=429, ErrorSource=downstream

- [ ] 4. **Update QueryData error handling** (line ~223 in `datasource.go`)
  - Replace `backend.ErrDataResponse(StatusInternal, ...)` with `mapMetricsErrorToDataResponse(err)`
  - **Verify:** E2E test against mock server returning 429; check Grafana panel shows orange "Rate limited" badge (not red "Error")

### Phase 2: Retry + Backoff (1–2 days)

- [ ] 5. **Add `getMetricsWithRetry` wrapper** in `clients/metrics/client.go`
  - Configure `backoff.NewExponentialBackOff()`: `InitialInterval=1s`, `MaxInterval=30s`, `MaxElapsedTime=2min`
  - Wrap `getMetrics` in `backoff.RetryWithData`
  - Honor `HTTPError.RetryAfter` by sleeping before retry
  - Mark permanent errors with `backoff.Permanent(err)`
  - **Verify:** Integration test with mock server: 429 (1st call) → 200 (2nd call); assert retry occurred and RetryAfter was honored

- [ ] 6. **Update `Get*Metrics` methods** to call `getMetricsWithRetry` instead of `getMetrics`
  - **Verify:** Regression test existing success cases; assert no behavior change

- [ ] 7. **Load test against bdpx_prd**
  - Dashboard with 5 panels, 1min refresh, inject 429 (if possible via rate-limit trigger)
  - Observe retry attempts in logs, confirm exponential backoff (1s, 2s, 4s, ...)
  - Confirm panels recover after API unblocks
  - **Verify:** No "plugin error" in Grafana; panels show "Rate limited" badge during 429, then recover

### Phase 3: Discovery Caching (Highest ROI) (1 day)

- [ ] 8. **Add `probeCache` field** to `MetricsDatasource` struct
  - Initialize with `gocache.New(10*time.Minute, 15*time.Minute)`
  - Add `github.com/patrickmn/go-cache` dependency
  - **Verify:** Datasource instantiation succeeds; no panics

- [ ] 9. **Add `probeCategoryWithCache` wrapper** in `datasource.go`
  - Cache key: `fmt.Sprintf("%s:%s:%s", datasourceUID, category, tenantId)`
  - Check cache before calling `probeCategory`
  - On error, return stale cache if available (graceful degradation)
  - **Verify:** Unit test: 1st call caches, 2nd call hits cache (no API call)

- [ ] 10. **Update CallResource handlers** (`handleGetMetrics`, `handleLabelKeys`, `handleLabelValues`)
  - Replace `probeCategory(...)` with `probeCategoryWithCache(...)`
  - **Verify:** E2E test: open query editor, observe 1 probe API call; close/reopen editor within 10min, observe 0 probe calls

- [ ] 11. **Load test discovery probes**
  - Rapidly open/close query editor 10x in 1min
  - Without cache: expect 10 probe calls
  - With cache: expect 1 probe call
  - **Verify:** Logs show "probe cache hit" messages; bdpx_prd API call volume drops 90%

### Phase 4: Health Check Resilience (0.5 days)

- [ ] 12. **Add `healthCache` field** to `MetricsDatasource` struct
  - Initialize with `gocache.New(5*time.Minute, 10*time.Minute)`
  - **Verify:** No panics

- [ ] 13. **Update `CheckHealth` method** with retry + cache fallback
  - 3 retry attempts with 1s, 2s, 3s backoff
  - Cache successful health result (5min TTL)
  - On failure after retries, return cached OK if available
  - **Verify:** Integration test: mock server fails 2x, succeeds 3rd; assert health returns OK; cache entry exists

- [ ] 14. **Test health check with transient 429**
  - Mock server: 429 (1st call) → 200 (2nd call)
  - Assert: Save & Test returns OK (retried successfully)
  - Mock server: 429 (all calls) + stale cache exists
  - Assert: Save & Test returns OK (graceful degradation)
  - **Verify:** UI shows datasource as healthy despite transient 429

### Phase 5: Query Caching + Singleflight (Optional, 2–3 days)

- [ ] 15. **Add `queryCache` + `singleflightGroup` fields** to `MetricsDatasource`
  - Initialize `queryCache` with 2min TTL
  - Initialize `singleflight.Group`
  - **Verify:** No panics

- [ ] 16. **Add `buildQueryCacheKey` helper**
  - Hash `(datasourceUID, category, roundedFrom, roundedTo, filters, tenantId)`
  - Round timestamps to 1min buckets
  - **Verify:** Unit test: identical queries → same key; different times within same minute → same key

- [ ] 17. **Wrap QueryData calls** with singleflight + cache
  - Check cache first; return if hit
  - Wrap GetXMetrics in `singleflightGroup.Do(...)`
  - Cache successful responses
  - **Verify:** Unit test: 5 concurrent identical queries → 1 API call (singleflight); 2nd batch within TTL → 0 API calls (cache)

- [ ] 18. **Load test dashboard refresh**
  - 10-panel dashboard, 30s refresh, 24h window
  - Measure API call volume: before (10 calls/refresh) vs after (1–2 calls/refresh + cache hits)
  - **Verify:** bdpx_prd API call volume drops 80–90%; no rate limit errors

### Phase 6: CIP Resilience (1–2 days)

- [ ] 19. **Add `QueryWithRetry` wrapper** in `clients/cip/client.go`
  - Configure backoff: `InitialInterval=500ms`, `MaxElapsedTime=30s`
  - Detect retryable errors by text matching (`timeout`, `connection`)
  - Mark permanent errors (`unauthorized`, `syntax error`)
  - **Verify:** Integration test: mock db fails with timeout (1st call) → succeeds (2nd call); assert retry occurred

- [ ] 20. **Update `Query`, `ListTables`, `DescribeColumns`** to call `QueryWithRetry`
  - **Verify:** Regression test; no behavior change on success

- [ ] 21. **Add `schemaCache` to CIP datasource**
  - Cache `ListTables`, `DescribeColumns`, `Sites` (20min TTL)
  - Wrap CallResource handlers
  - **Verify:** E2E test: query editor /tables call caches; 2nd call hits cache

- [ ] 22. **Map CIP errors** to `backend.ErrDataResponseWithSource(StatusInternal, ErrorSourceDownstream, ...)`
  - All CIP errors → downstream source (can't extract HTTP status)
  - **Verify:** E2E test: CIP query fails → Grafana shows "downstream error", not "plugin error"

### Phase 7: Documentation + Final Verification (1 day)

- [ ] 23. **Document rate-limit best practices** in README + docs site
  - Min refresh interval (5–10min)
  - maxDataPoints impact
  - 429 error recovery behavior
  - **Verify:** Docs build successfully; links work

- [ ] 24. **End-to-end load test against bdpx_prd**
  - 10-panel Metrics dashboard, 1min refresh, 7d window
  - 5-panel CIP dashboard, 2min refresh, 1d window
  - Run for 30min; monitor API call volume, 429 rate, cache hit rate
  - **Verify:** Zero 429 errors after initial burst; API calls stable at < 10/min; cache hit rate > 80%

- [ ] 25. **Changeset + PR**
  - Changeset: `'b2c-grafana-datasource': minor` (new resilience features)
  - PR title: `@W-<ticket> Add rate-limit resilience (429 handling, retry, caching) to Grafana datasource`
  - PR summary: Tier 1 + Tier 2 features, before/after metrics, testing notes
  - **Verify:** CI passes; review approved

---

## Summary: Why This Plan Works

1. **Incremental + Verifiable**: Each phase is independently testable against live API; no big-bang merge risk.
2. **Prioritized by Impact**: Tier 1 (error visibility + retry + discovery caching) delivers 80% of value in 3–4 days; Tier 2 (query caching + singleflight) polishes to 95%.
3. **Grounded in SDK Reality**: Every recommendation uses verified `grafana-plugin-sdk-go` v0.257.0 symbols (`backend.StatusTooManyRequests`, `ErrorSourceFromHTTPStatus`, `instancemgmt` lifecycle).
4. **OSS-Friendly**: No Enterprise/Cloud-only features in Tier 1–2; clearly flags Tier 3 (Enterprise query caching) as optional.
5. **CIP-Aware**: Recognizes database/sql layer can't use HTTP middleware; provides separate retry pattern for Avatica path.
6. **Testable Abstraction**: `resilience` package centralizes retry+cache+singleflight for both Metrics and CIP; mock-friendly interface.
7. **Production-Ready**: After Phase 4, plugin survives 429s gracefully (proper status codes, downstream attribution, retry, cached probes). After Phase 5, API load drops 80–90% (cache + coalescing).

**Bottom line:** Tier 1 makes the plugin *safe* for production (won't crash on 429, proper error attribution). Tier 2 makes it *efficient* (low API footprint, dashboard-friendly). Implement Tier 1 first (1 week), Tier 2 second (1 week), ship to users.