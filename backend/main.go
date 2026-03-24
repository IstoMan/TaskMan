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
	router.Use(services.CORSMiddleware())

	mainRoutes := router.Group("/api")
	mainRoutes.GET("/health", services.CheckHealth)
	mainRoutes.POST("/users", services.CreateUser)
	mainRoutes.POST("/users/login", services.LoginUser)

	authRoutes := mainRoutes.Group("")
	authRoutes.Use(services.AuthMiddleware)
	{
		authRoutes.GET("/users/me", services.GetCurrentUser)
		authRoutes.POST("/users/logout", services.LogoutUser)
	}

	adminRoutes := mainRoutes.Group("")
	adminRoutes.Use(services.AuthMiddleware, services.AdminMiddleware)
	{
		adminRoutes.GET("/users", services.ListUsers)
		adminRoutes.GET("/dashboard", services.GetDashboard)

		taskRoutes := adminRoutes.Group("/tasks")
		taskRoutes.GET("", services.ListTasks)
		taskRoutes.POST("", services.CreateTask)
		taskRoutes.PATCH("/:id", services.UpdateTask)
		taskRoutes.DELETE("/:id", services.RemoveTask)

		projectRoutes := adminRoutes.Group("/projects")
		projectRoutes.GET("", services.ListProjects)
		projectRoutes.POST("", services.CreateProject)
		projectRoutes.PATCH("/:id", services.UpdateProject)
		projectRoutes.DELETE("/:id", services.RemoveProject)
	}

	fmt.Printf("Server Listening on localhost%s\n", serverPort)

	log.Fatal(router.Run("localhost" + serverPort))
}
