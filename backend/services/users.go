// Package services: Defines all the user functions
package services

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"istoman.backend.task.com/models"
)

var allowedMemberTitles = []string{
	"Designer",
	"Project Manager",
	"Engineer",
	"QA Engineer",
	"Product Manager",
	"DevOps Engineer",
}

func isAllowedMemberTitle(raw string) bool {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return true
	}

	for _, candidate := range allowedMemberTitles {
		if candidate == trimmed {
			return true
		}
	}

	return false
}

func mapUser(user models.User) gin.H {
	return gin.H{
		"id":           user.UserID,
		"name":         user.Name,
		"email":        user.Email,
		"role":         user.Role,
		"member_title": user.MemberTitle,
	}
}

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

	newUser.MemberTitle = strings.TrimSpace(newUser.MemberTitle)
	if !isAllowedMemberTitle(newUser.MemberTitle) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member title"})
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
		"id":           newUser.UserID,
		"name":         newUser.Name,
		"role":         newUser.Role,
		"member_title": newUser.MemberTitle,
		"email":        newUser.Email,
		"created_at":   newUser.CreatedAt,
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

func ListUsers(c *gin.Context) {
	var users []models.User
	if err := models.DB.Order("created_at DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't fetch users"})
		return
	}

	response := make([]gin.H, 0, len(users))
	for _, user := range users {
		response = append(response, mapUser(user))
	}

	c.JSON(http.StatusOK, gin.H{"users": response})
}

func ListMembers(c *gin.Context) {
	query := models.DB.Model(&models.User{}).Order("created_at DESC")

	role, _ := c.Get("role")
	if role == "admin" {
		memberTitle := strings.TrimSpace(c.Query("member_title"))
		if memberTitle != "" {
			if !isAllowedMemberTitle(memberTitle) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member_title"})
				return
			}
			query = query.Where("member_title = ?", memberTitle)
		}
	}

	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't fetch members"})
		return
	}

	response := make([]gin.H, 0, len(users))
	for _, user := range users {
		response = append(response, mapUser(user))
	}

	c.JSON(http.StatusOK, gin.H{
		"users":          response,
		"allowed_titles": allowedMemberTitles,
	})
}

func UpdateMemberTitle(c *gin.Context) {
	userIDRaw := strings.TrimSpace(c.Param("id"))
	if userIDRaw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user id"})
		return
	}

	userID, err := uuid.Parse(userIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	var payload struct {
		MemberTitle string `json:"member_title"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	payload.MemberTitle = strings.TrimSpace(payload.MemberTitle)
	if !isAllowedMemberTitle(payload.MemberTitle) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member title"})
		return
	}

	var user models.User
	if err := models.DB.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.MemberTitle = payload.MemberTitle
	if err := models.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't update member title"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": mapUser(user)})
}

func GetCurrentUser(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing user in auth context"})
		return
	}

	userIDString, ok := userIDRaw.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid auth user"})
		return
	}

	userID, err := uuid.Parse(userIDString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid auth user"})
		return
	}

	var user models.User
	if err := models.DB.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": mapUser(user),
	})
}

func LogoutUser(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authorization", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}
