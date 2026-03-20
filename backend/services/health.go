package services

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func CheckHealth(c *gin.Context) {
	output := map[string]string{"status": "OK", "timestamp": time.Now().UTC().Format(time.RFC3339)}
	c.JSON(http.StatusOK, output)
}
