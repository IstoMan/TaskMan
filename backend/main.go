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
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			log.Printf("failed to load .env: %v", err)
		}
	}

	services.InitDB()

	serverPort := os.Getenv("PORT")
	if serverPort == "" {
		serverPort = "8080"
	}
	if serverPort[0] != ':' {
		serverPort = ":" + serverPort
	}

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
		authRoutes.GET("/members", services.ListMembers)
		authRoutes.POST("/users/logout", services.LogoutUser)
		authRoutes.GET("/dashboard", services.GetDashboard)
		authRoutes.GET("/projects", services.ListProjects)
		authRoutes.GET("/tasks", services.ListTasks)
		authRoutes.PATCH("/tasks/:id", services.UpdateTask)
	}

	adminRoutes := mainRoutes.Group("")
	adminRoutes.Use(services.AuthMiddleware, services.AdminMiddleware)
	{
		adminRoutes.GET("/users", services.ListUsers)
		adminRoutes.PATCH("/members/:id/title", services.UpdateMemberTitle)

		adminRoutes.POST("/tasks", services.CreateTask)
		adminRoutes.DELETE("/tasks/:id", services.RemoveTask)

		adminRoutes.POST("/projects", services.CreateProject)
		adminRoutes.PATCH("/projects/:id", services.UpdateProject)
		adminRoutes.DELETE("/projects/:id", services.RemoveProject)
	}

	fmt.Printf("Server listening on 0.0.0.0%s\n", serverPort)
	log.Fatal(router.Run("0.0.0.0" + serverPort))
}
