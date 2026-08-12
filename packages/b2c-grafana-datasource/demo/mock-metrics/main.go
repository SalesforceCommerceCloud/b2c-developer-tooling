package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
)

const (
	realm = "bdpx"
)

type OAuthResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	Scope       string `json:"scope"`
}

type DataPoint struct {
	Timestamp int64   `json:"timestamp"`
	Value     float64 `json:"value"`
}

type DataSeries struct {
	ID   string      `json:"id"`
	Name string      `json:"name"`
	Data []DataPoint `json:"data"`
}

type Metric struct {
	MetricID    string       `json:"metricId"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Unit        string       `json:"unit"`
	DataSeries  []DataSeries `json:"dataSeries"`
}

type MetricsResponse struct {
	Data []Metric `json:"data"`
}

func main() {
	http.HandleFunc("/dwsso/oauth2/access_token", handleOAuth)
	http.HandleFunc("/observability/metrics/v1/organizations/", handleMetrics)
	// Liveness endpoint for container healthchecks (GET, so wget --spider succeeds).
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	port := ":8080"
	log.Printf("Mock Metrics + OAuth server listening on %s", port)
	log.Printf("OAuth endpoint: POST http://localhost%s/dwsso/oauth2/access_token", port)
	log.Printf("Metrics endpoint: GET http://localhost%s/observability/metrics/v1/organizations/{orgId}/metrics/{category}", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleOAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Return a well-formed JWT-ish token (3 segments)
	resp := OAuthResponse{
		AccessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vIiwic2NvcGUiOiJzZmNjLm1ldHJpY3MiLCJleHAiOjk5OTk5OTk5OTl9.mock_signature_for_demo",
		TokenType:   "Bearer",
		ExpiresIn:   3600,
		Scope:       "sfcc.metrics",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse path: /observability/metrics/v1/organizations/{orgId}/metrics/{category}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/observability/metrics/v1/organizations/"), "/")
	if len(parts) < 3 || parts[1] != "metrics" {
		http.Error(w, "Invalid path", http.StatusNotFound)
		return
	}

	category := parts[2]
	query := r.URL.Query()

	fromStr := query.Get("from")
	toStr := query.Get("to")

	if fromStr == "" || toStr == "" {
		http.Error(w, "Missing from/to parameters", http.StatusBadRequest)
		return
	}

	from, err := strconv.ParseInt(fromStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid from parameter", http.StatusBadRequest)
		return
	}

	to, err := strconv.ParseInt(toStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid to parameter", http.StatusBadRequest)
		return
	}

	// Get filters
	apiFamily := query.Get("apiFamily")
	apiName := query.Get("apiName")
	ocapiCategory := query.Get("ocapiCategory")
	ocapiAPI := query.Get("ocapiApi")
	thirdPartyServiceID := query.Get("thirdPartyServiceId")

	metrics := generateMetrics(category, from, to, apiFamily, apiName, ocapiCategory, ocapiAPI, thirdPartyServiceID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(MetricsResponse{Data: metrics})
}

func generateMetrics(category string, from, to int64, apiFamily, apiName, ocapiCategory, ocapiAPI, thirdPartyServiceID string) []Metric {
	switch category {
	case "overall":
		return generateOverallMetrics(from, to)
	case "sales":
		return generateSalesMetrics(from, to)
	case "ecdn":
		return generateECDNMetrics(from, to)
	case "third-party":
		return generateThirdPartyMetrics(from, to, thirdPartyServiceID)
	case "scapi":
		return generateSCAPIMetrics(from, to, apiFamily, apiName)
	case "scapi-hooks":
		return generateSCAPIHooksMetrics(from, to)
	case "mrt":
		return generateMRTMetrics(from, to)
	case "controller":
		return generateControllerMetrics(from, to)
	case "ocapi":
		return generateOCAPIMetrics(from, to, ocapiCategory, ocapiAPI)
	default:
		return []Metric{}
	}
}

func generateTimePoints(from, to int64) []int64 {
	points := []int64{}
	interval := int64(300) // 5 minutes
	for t := from; t <= to; t += interval {
		points = append(points, t)
	}
	// Ensure we have at least 2 points
	if len(points) == 0 {
		points = append(points, from, to)
	} else if len(points) == 1 {
		points = append(points, to)
	}
	return points
}

func sineWithJitter(t int64, base, amplitude, period, jitter float64) float64 {
	normalized := float64(t) / period
	sine := base + amplitude*math.Sin(2*math.Pi*normalized)
	jitterVal := (float64(t%100)/100.0 - 0.5) * jitter
	return math.Max(0, sine+jitterVal)
}

func generateOverallMetrics(from, to int64) []Metric {
	points := generateTimePoints(from, to)
	series := []DataSeries{
		{
			ID:   fmt.Sprintf("%s.total", realm),
			Name: "total",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 5000, 2000, 3600, 500)
			}),
		},
		{
			ID:   fmt.Sprintf("%s.success", realm),
			Name: "success",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 4800, 1900, 3600, 400)
			}),
		},
		{
			ID:   fmt.Sprintf("%s.error", realm),
			Name: "error",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 200, 100, 3600, 50)
			}),
		},
	}

	return []Metric{
		{
			MetricID:    "totalCalls",
			Title:       "Total Calls",
			Description: "Total API calls across all services",
			Unit:        "calls",
			DataSeries:  series,
		},
	}
}

func generateSalesMetrics(from, to int64) []Metric {
	points := generateTimePoints(from, to)
	return []Metric{
		{
			MetricID:    "orderRevenue",
			Title:       "Order Revenue",
			Description: "Total revenue from orders",
			Unit:        "USD",
			DataSeries: []DataSeries{
				{
					ID:   fmt.Sprintf("%s.revenue", realm),
					Name: "revenue",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 50000, 20000, 7200, 5000)
					}),
				},
			},
		},
		{
			MetricID:    "orderCount",
			Title:       "Order Count",
			Description: "Number of orders placed",
			Unit:        "orders",
			DataSeries: []DataSeries{
				{
					ID:   fmt.Sprintf("%s.orders", realm),
					Name: "orders",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 500, 200, 7200, 50)
					}),
				},
			},
		},
	}
}

func generateECDNMetrics(from, to int64) []Metric {
	points := generateTimePoints(from, to)
	series := []DataSeries{
		{
			ID:   fmt.Sprintf("2xx %s.host", realm),
			Name: "2xx",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 9500, 1000, 3600, 200)
			}),
		},
		{
			ID:   fmt.Sprintf("3xx %s.host", realm),
			Name: "3xx",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 300, 100, 3600, 30)
			}),
		},
		{
			ID:   fmt.Sprintf("4xx %s.host", realm),
			Name: "4xx",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 150, 50, 3600, 20)
			}),
		},
		{
			ID:   fmt.Sprintf("5xx %s.host", realm),
			Name: "5xx",
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 50, 20, 3600, 10)
			}),
		},
	}

	return []Metric{
		{
			MetricID:    "statusCounts",
			Title:       "Status Counts",
			Description: "Request count by status class",
			Unit:        "requests",
			DataSeries:  series,
		},
	}
}

func generateThirdPartyMetrics(from, to int64, serviceID string) []Metric {
	points := generateTimePoints(from, to)

	// Default services if no filter
	services := []string{
		fmt.Sprintf("%s.login.salesforce.com", realm),
		fmt.Sprintf("%s.api.stripe.com", realm),
	}

	if serviceID != "" {
		services = []string{fmt.Sprintf("%s.%s", realm, serviceID)}
	}

	var series []DataSeries
	for _, svc := range services {
		name := strings.TrimPrefix(svc, realm+".")
		series = append(series, DataSeries{
			ID:   svc,
			Name: name,
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 100, 30, 3600, 10)
			}),
		})
	}

	return []Metric{
		{
			MetricID:    "thirdPartyCalls",
			Title:       "Third Party Calls",
			Description: "Calls to third-party services",
			Unit:        "calls",
			DataSeries:  series,
		},
		{
			MetricID:    "thirdPartyLatency",
			Title:       "Third Party Latency",
			Description: "Latency for third-party service calls",
			Unit:        "ms",
			DataSeries:  generateLatencySeries(points, services),
		},
	}
}

func generateSCAPIMetrics(from, to int64, apiFamily, apiName string) []Metric {
	points := generateTimePoints(from, to)

	families := []string{"product", "custom", "search"}
	if apiFamily != "" {
		families = []string{apiFamily}
	}

	var callSeries []DataSeries
	var cacheSeries []DataSeries

	for _, family := range families {
		// Total calls per family → series id "bdpx.product" (familyOrStatus → apiFamily)
		callSeries = append(callSeries, DataSeries{
			ID:   fmt.Sprintf("%s.%s", realm, family),
			Name: family,
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 1000, 400, 3600, 100)
			}),
		})

		// Cache hit/miss → series id "bdpx.product HIT" (lastSpaceSplit → apiFamily + cacheStatus)
		cacheSeries = append(cacheSeries, DataSeries{
			ID:   fmt.Sprintf("%s.%s HIT", realm, family),
			Name: fmt.Sprintf("%s HIT", family),
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 800, 300, 3600, 80)
			}),
		})
		cacheSeries = append(cacheSeries, DataSeries{
			ID:   fmt.Sprintf("%s.%s MISS", realm, family),
			Name: fmt.Sprintf("%s MISS", family),
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 200, 100, 3600, 20)
			}),
		})
	}

	// Response count by bare status class → series id "bdpx 2xx" (familyOrStatus → statusClass).
	// The real API mixes these status-class series into the responseCount metric alongside
	// per-family series; here we emit the status breakdown which drives the statusClass tag.
	statusSeries := []DataSeries{
		{ID: fmt.Sprintf("%s 2xx", realm), Name: "2xx", Data: generateData(points, func(t int64) float64 { return sineWithJitter(t, 2800, 1000, 3600, 200) })},
		{ID: fmt.Sprintf("%s 4xx", realm), Name: "4xx", Data: generateData(points, func(t int64) float64 { return sineWithJitter(t, 120, 60, 3600, 15) })},
		{ID: fmt.Sprintf("%s 5xx", realm), Name: "5xx", Data: generateData(points, func(t int64) float64 { return sineWithJitter(t, 30, 15, 3600, 8) })},
	}

	// MetricIds MUST match the real Metrics API (and the tag-enrichment catalog):
	// totalCalls (familyOrStatus), responseCount (familyOrStatus), cacheHitRate (lastSpaceSplit),
	// requestLatency (familyOrOverallAgg). Using the real ids is what makes tag enrichment fire.
	return []Metric{
		{
			MetricID:    "totalCalls",
			Title:       "SCAPI Total Calls",
			Description: "Total SCAPI calls by API family",
			Unit:        "calls",
			DataSeries:  callSeries,
		},
		{
			MetricID:    "responseCount",
			Title:       "SCAPI Responses by Status Class",
			Description: "SCAPI responses by HTTP status class",
			Unit:        "calls",
			DataSeries:  statusSeries,
		},
		{
			MetricID:    "cacheHitRate",
			Title:       "SCAPI Cache Hit/Miss",
			Description: "SCAPI cache hit/miss counts by API family",
			Unit:        "calls",
			DataSeries:  cacheSeries,
		},
		{
			MetricID:    "requestLatency",
			Title:       "SCAPI Request Latency",
			Description: "SCAPI request latency by API family",
			Unit:        "ms",
			DataSeries:  generateLatencySeries(points, families),
		},
	}
}

func generateSCAPIHooksMetrics(from, to int64) []Metric {
	points := generateTimePoints(from, to)
	return []Metric{
		{
			MetricID:    "hookCalls",
			Title:       "Hook Calls",
			Description: "SCAPI hook invocations",
			Unit:        "calls",
			DataSeries: []DataSeries{
				{
					ID:   fmt.Sprintf("%s.before", realm),
					Name: "before",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 200, 80, 3600, 20)
					}),
				},
				{
					ID:   fmt.Sprintf("%s.after", realm),
					Name: "after",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 200, 80, 3600, 20)
					}),
				},
			},
		},
		{
			MetricID:    "hookLatency",
			Title:       "Hook Latency",
			Description: "Hook execution time",
			Unit:        "ms",
			DataSeries: []DataSeries{
				{
					ID:   fmt.Sprintf("%s.hooks", realm),
					Name: "hooks",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 50, 20, 3600, 10)
					}),
				},
			},
		},
	}
}

func generateMRTMetrics(from, to int64) []Metric {
	points := generateTimePoints(from, to)
	return []Metric{
		{
			MetricID:    "mrtInvocations",
			Title:       "MRT Invocations",
			Description: "Lambda function invocations",
			Unit:        "invocations",
			DataSeries: []DataSeries{
				{
					ID:   fmt.Sprintf("%s.function1", realm),
					Name: "function1",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 150, 50, 3600, 15)
					}),
				},
				{
					ID:   fmt.Sprintf("%s.function2", realm),
					Name: "function2",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 100, 40, 3600, 10)
					}),
				},
			},
		},
		{
			MetricID:    "mrtDuration",
			Title:       "MRT Duration",
			Description: "Function execution duration",
			Unit:        "ms",
			DataSeries: []DataSeries{
				{
					ID:   fmt.Sprintf("%s.mrt", realm),
					Name: "mrt",
					Data: generateData(points, func(t int64) float64 {
						return sineWithJitter(t, 250, 100, 3600, 30)
					}),
				},
			},
		},
	}
}

func generateControllerMetrics(from, to int64) []Metric {
	points := generateTimePoints(from, to)
	controllers := []string{"Product-Show", "Search-Show", "Cart-AddProduct"}

	var series []DataSeries
	for _, ctrl := range controllers {
		series = append(series, DataSeries{
			ID:   fmt.Sprintf("%s.%s", realm, ctrl),
			Name: ctrl,
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 500, 200, 3600, 50)
			}),
		})
	}

	return []Metric{
		{
			MetricID:    "controllerCalls",
			Title:       "Controller Calls",
			Description: "Controller invocation counts",
			Unit:        "calls",
			DataSeries:  series,
		},
		{
			MetricID:    "controllerLatency",
			Title:       "Controller Latency",
			Description: "Controller execution time",
			Unit:        "ms",
			DataSeries:  generateLatencySeries(points, controllers),
		},
	}
}

func generateOCAPIMetrics(from, to int64, ocapiCategory, ocapiAPI string) []Metric {
	points := generateTimePoints(from, to)

	categories := []string{"shop", "data"}
	if ocapiCategory != "" {
		categories = []string{ocapiCategory}
	}

	var series []DataSeries
	for _, cat := range categories {
		series = append(series, DataSeries{
			ID:   fmt.Sprintf("%s.%s", realm, cat),
			Name: cat,
			Data: generateData(points, func(t int64) float64 {
				return sineWithJitter(t, 800, 300, 3600, 80)
			}),
		})
	}

	return []Metric{
		{
			MetricID:    "ocapiCalls",
			Title:       "OCAPI Calls",
			Description: "OCAPI call counts by category",
			Unit:        "calls",
			DataSeries:  series,
		},
		{
			MetricID:    "ocapiLatency",
			Title:       "OCAPI Latency",
			Description: "OCAPI request latency",
			Unit:        "ms",
			DataSeries:  generateLatencySeries(points, categories),
		},
	}
}

func generateData(points []int64, valueFunc func(int64) float64) []DataPoint {
	data := make([]DataPoint, len(points))
	for i, t := range points {
		data[i] = DataPoint{
			Timestamp: t,
			Value:     valueFunc(t),
		}
	}
	return data
}

func generateLatencySeries(points []int64, names []string) []DataSeries {
	series := make([]DataSeries, len(names))
	for i, name := range names {
		shortName := strings.TrimPrefix(name, realm+".")
		series[i] = DataSeries{
			ID:   fmt.Sprintf("%s.%s", realm, shortName),
			Name: shortName,
			Data: generateData(points, func(t int64) float64 {
				// Latency: 50-300ms with sine wave and jitter
				return sineWithJitter(t, 150, 100, 7200, 30)
			}),
		}
	}
	return series
}
