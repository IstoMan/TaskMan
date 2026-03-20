package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"istoman.backend.task.com/services"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Couldn't Load .env error: %v", err)
	}

	services.InitDB()

	serverPort := os.Getenv("PORT")

	router := gin.Default()
	router.GET("/health", services.CheckHealth)
	router.POST("/users", services.CreateUser)
	router.POST("/users/login", services.LoginUser)

	taskRoutes := router.Group("/tasks")
	taskRoutes.Use(services.AuthMiddleware, services.AdminMiddleware)
	{
		taskRoutes.POST("", services.CreateTask)
		taskRoutes.DELETE("/:id", services.RemoveTask)
		taskRoutes.PATCH("/:id", services.AssignTask)
	}

	fmt.Printf("Server Listening on localhost%s\n", serverPort)

	log.Fatal(router.Run("localhost" + serverPort))
}
