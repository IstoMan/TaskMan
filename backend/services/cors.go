package services

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware allows browser requests only from origins listed in CORS_ALLOWED_ORIGINS
// (comma-separated). No wildcards. Defaults to http://localhost:3000 when unset for local dev;
// set explicitly in production to your frontend origin(s) only.
func CORSMiddleware() gin.HandlerFunc {
	origins := parseCORSAllowedOrigins()
	return cors.New(cors.Config{
		AllowOrigins: origins,
		// Match routes in main: health GET, users POST, tasks POST/PATCH/DELETE
		AllowMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		// Only headers this API expects on cross-origin requests
		AllowHeaders: []string{"Content-Type", "Authorization"},
		// Login sets httpOnly cookie; needed if the browser calls the API directly with credentials
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}

func parseCORSAllowedOrigins() []string {
	raw := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if raw == "" {
		return []string{"http://localhost:3000"}
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	if len(out) == 0 {
		return []string{"http://localhost:3000"}
	}
	return out
}
