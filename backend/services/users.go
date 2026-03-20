// Package services: Defines all the user functions
package services

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"istoman.backend.task.com/models"
)

func CreateUser(c *gin.Context) {
	var newUser models.User
	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if !newUser.Role.Valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Member can either be member or admin"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newUser.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't Generate Hash"})
		return
	}

	newUser.Password = string(hashedPassword)
	newUser.UserID = uuid.New()

	result := models.DB.Create(&newUser)
	if result.Error != nil {
		c.JSON(http.StatusConflict, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":         newUser.UserID,
		"name":       newUser.Name,
		"role":       newUser.Role,
		"email":      newUser.Email,
		"created_at": newUser.CreatedAt,
	})
}

func LoginUser(c *gin.Context) {
	var newUser models.User
	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if newUser.Email == "" || newUser.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and Password are required"})
		return
	}

	var oldUser models.User
	output := models.DB.Where("email = ?", newUser.Email).First(&oldUser)
	if output.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(oldUser.Password), []byte(newUser.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password not Correct"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  oldUser.UserID.String(),
		"role": oldUser.Role,
		"exp":  time.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't generate JWT"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authorization", tokenString, 60*60*24*30, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"message": "Login Successful",
	})
}
