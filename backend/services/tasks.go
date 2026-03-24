package services

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"istoman.backend.task.com/models"
)

type taskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	ProjectID   string `json:"project_id"`
	AssigneeID  string `json:"assignee_id"`
	Deadline    string `json:"deadline"`
	Status      string `json:"status"`
}

type taskPatchRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	ProjectID   *string `json:"project_id"`
	AssigneeID  *string `json:"assignee_id"`
	Deadline    *string `json:"deadline"`
	Status      *string `json:"status"`
}

type taskResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ProjectID   string `json:"project_id"`
	AssigneeID  string `json:"assignee_id"`
	Deadline    string `json:"deadline"`
	Status      string `json:"status"`
	Project     string `json:"project"`
	Assignee    string `json:"assignee"`
}

type dashboardStatsResponse struct {
	TotalTasks      int64 `json:"total_tasks"`
	TasksDone       int64 `json:"tasks_done"`
	TasksInProgress int64 `json:"tasks_in_progress"`
	TotalMembers    int64 `json:"total_members"`
	TotalProjects   int64 `json:"total_projects"`
}

type dashboardProjectResponse struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Description        string `json:"description"`
	TaskCount          int64  `json:"task_count"`
	CompletedTaskCount int64  `json:"completed_task_count"`
}

type dashboardResponse struct {
	Stats       dashboardStatsResponse     `json:"stats"`
	Projects    []dashboardProjectResponse `json:"projects"`
	RecentTasks []taskResponse             `json:"recent_tasks"`
}

func normalizeStatus(raw models.Status) models.Status {
	switch raw {
	case models.COMPLETED:
		return models.DONE
	case models.PENDING:
		return models.TODO
	case models.TODO, models.INPROGRESS, models.DONE:
		return raw
	default:
		return models.TODO
	}
}

func parseStatus(raw string) (models.Status, bool) {
	switch strings.TrimSpace(raw) {
	case string(models.TODO), string(models.PENDING):
		return models.TODO, true
	case string(models.INPROGRESS):
		return models.INPROGRESS, true
	case string(models.DONE), string(models.COMPLETED):
		return models.DONE, true
	default:
		return "", false
	}
}

func parseUUIDPointer(raw string) (*uuid.UUID, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, nil
	}
	value, err := uuid.Parse(trimmed)
	if err != nil {
		return nil, err
	}
	return &value, nil
}

func parseDeadline(raw string) (*time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, nil
	}

	layouts := []string{
		time.RFC3339,
		"2006-01-02T15:04",
		"2006-01-02 15:04",
		"02/01/2006 03:04 PM",
	}

	for _, layout := range layouts {
		parsed, err := time.Parse(layout, trimmed)
		if err == nil {
			return &parsed, nil
		}
	}

	return nil, errors.New("unsupported deadline format")
}

func formatDeadline(deadline *time.Time) string {
	if deadline == nil {
		return ""
	}
	return deadline.Format("2006-01-02T15:04")
}

func mapTask(task models.Task) taskResponse {
	projectID := ""
	if task.ProjectID != nil {
		projectID = task.ProjectID.String()
	}

	assigneeID := ""
	if task.UserID != nil {
		assigneeID = task.UserID.String()
	}

	projectName := ""
	if task.Project != nil {
		projectName = task.Project.Name
	}

	assigneeName := ""
	if task.AssignedMember != nil {
		assigneeName = task.AssignedMember.Name
	}

	return taskResponse{
		ID:          task.TaskID.String(),
		Title:       task.TaskTitle,
		Description: task.TaskDesc,
		ProjectID:   projectID,
		AssigneeID:  assigneeID,
		Deadline:    formatDeadline(task.Deadline),
		Status:      string(normalizeStatus(task.Progress)),
		Project:     projectName,
		Assignee:    assigneeName,
	}
}

func ensureProjectExists(projectID *uuid.UUID) error {
	if projectID == nil {
		return nil
	}

	var found models.Project
	result := models.DB.Where("project_id = ?", *projectID).First(&found)
	return result.Error
}

func ensureUserExists(userID *uuid.UUID) error {
	if userID == nil {
		return nil
	}

	var found models.User
	result := models.DB.Where("user_id = ?", *userID).First(&found)
	return result.Error
}

func ListTasks(c *gin.Context) {
	query := models.DB.Model(&models.Task{}).
		Preload("AssignedMember").
		Preload("Project").
		Order("created_at DESC")

	role, _ := c.Get("role")
	if role == "member" {
		userID, _ := c.Get("user_id")
		parsedUID, err := uuid.Parse(userID.(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid auth user"})
			return
		}
		query = query.Where("user_id = ?", parsedUID)
	}

	projectID := c.Query("project_id")
	if strings.TrimSpace(projectID) != "" {
		parsedProjectID, err := uuid.Parse(projectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
			return
		}
		query = query.Where("project_id = ?", parsedProjectID)
	}

	if limitRaw := c.Query("limit"); limitRaw != "" {
		limit, err := strconv.Atoi(limitRaw)
		if err != nil || limit <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
		query = query.Limit(limit)
	}

	var tasks []models.Task
	output := query.Find(&tasks)
	if output.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't fetch tasks"})
		return
	}

	response := make([]taskResponse, 0, len(tasks))
	for _, task := range tasks {
		response = append(response, mapTask(task))
	}

	c.JSON(http.StatusOK, gin.H{"tasks": response})
}

func CreateTask(c *gin.Context) {
	var payload taskRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if strings.TrimSpace(payload.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task title cannot be empty"})
		return
	}

	projectID, err := parseUUIDPointer(payload.ProjectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
		return
	}
	if err := ensureProjectExists(projectID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	assigneeID, err := parseUUIDPointer(payload.AssigneeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignee_id"})
		return
	}
	if err := ensureUserExists(assigneeID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignee not found"})
		return
	}

	deadline, err := parseDeadline(payload.Deadline)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deadline format"})
		return
	}

	status := models.TODO
	if strings.TrimSpace(payload.Status) != "" {
		parsedStatus, ok := parseStatus(payload.Status)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task status"})
			return
		}
		status = parsedStatus
	}

	newTask := models.Task{
		TaskID:    uuid.New(),
		TaskTitle: strings.TrimSpace(payload.Title),
		TaskDesc:  strings.TrimSpace(payload.Description),
		ProjectID: projectID,
		UserID:    assigneeID,
		Deadline:  deadline,
		Progress:  status,
	}

	output := models.DB.Create(&newTask)
	if output.Error != nil {
		log.Printf("Couldn't add entry: error: %v", output.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't add entry"})
		return
	}

	var createdTask models.Task
	if err := models.DB.
		Preload("AssignedMember").
		Preload("Project").
		Where("task_id = ?", newTask.TaskID).
		First(&createdTask).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Task created but failed to load response"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"task": mapTask(createdTask)})
}

func RemoveTask(c *gin.Context) {
	taskID := c.Param("id")
	TaskID, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Couldn't Prase taskID"})
		return
	}

	output := models.DB.Where("task_id = ?", TaskID).Delete(&models.Task{})
	if output.Error != nil {
		log.Printf("Couldn't delete task, error: %v\n", output.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't Delete task"})
		return
	}

	c.Status(http.StatusAccepted)
}

func UpdateTask(c *gin.Context) {
	taskID := c.Param("id")
	TaskID, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	role, _ := c.Get("role")
	isMember := role == "member"

	if isMember {
		userIDRaw, _ := c.Get("user_id")
		parsedUID, err := uuid.Parse(userIDRaw.(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid auth user"})
			return
		}

		var existing models.Task
		if err := models.DB.Where("task_id = ?", TaskID).First(&existing).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		if existing.UserID == nil || *existing.UserID != parsedUID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only update tasks assigned to you"})
			return
		}
	}

	var patch taskPatchRequest
	if err := c.ShouldBindJSON(&patch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if isMember {
		if patch.Status == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Members can only update task status"})
			return
		}
		patch = taskPatchRequest{Status: patch.Status}
	}

	updates := map[string]any{}

	if patch.Title != nil {
		updates["task_title"] = strings.TrimSpace(*patch.Title)
	}

	if patch.Description != nil {
		updates["task_desc"] = strings.TrimSpace(*patch.Description)
	}

	if patch.ProjectID != nil {
		projectID, err := parseUUIDPointer(*patch.ProjectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
			return
		}
		if err := ensureProjectExists(projectID); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		updates["project_id"] = projectID
	}

	if patch.AssigneeID != nil {
		assigneeID, err := parseUUIDPointer(*patch.AssigneeID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignee_id"})
			return
		}
		if err := ensureUserExists(assigneeID); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Assignee not found"})
			return
		}
		updates["user_id"] = assigneeID
	}

	if patch.Deadline != nil {
		deadline, err := parseDeadline(*patch.Deadline)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deadline format"})
			return
		}
		updates["deadline"] = deadline
	}

	if patch.Status != nil {
		parsedStatus, ok := parseStatus(*patch.Status)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task status"})
			return
		}
		updates["progress"] = parsedStatus
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No task fields provided to update"})
		return
	}

	var newTask models.Task
	output := models.DB.Where("task_id = ?", TaskID).Model(&newTask).Updates(updates)
	if output.Error != nil {
		log.Printf("Couldn't update the struct error: %v", output.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": output.Error.Error()})
		return
	}

	var updatedTask models.Task
	if err := models.DB.
		Preload("AssignedMember").
		Preload("Project").
		Where("task_id = ?", TaskID).
		First(&updatedTask).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Task updated but failed to load response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"task": mapTask(updatedTask)})
}

func GetDashboard(c *gin.Context) {
	var totalTasks int64
	var tasksDone int64
	var tasksInProgress int64
	var totalMembers int64
	var totalProjects int64

	if err := models.DB.Model(&models.Task{}).Count(&totalTasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute dashboard stats"})
		return
	}

	if err := models.DB.Model(&models.Task{}).Where("progress IN ?", []models.Status{models.DONE, models.COMPLETED}).Count(&tasksDone).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute dashboard stats"})
		return
	}

	if err := models.DB.Model(&models.Task{}).Where("progress = ?", models.INPROGRESS).Count(&tasksInProgress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute dashboard stats"})
		return
	}

	if err := models.DB.Model(&models.User{}).Count(&totalMembers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute dashboard stats"})
		return
	}

	if err := models.DB.Model(&models.Project{}).Count(&totalProjects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute dashboard stats"})
		return
	}

	var projects []models.Project
	if err := models.DB.Order("created_at DESC").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't fetch projects"})
		return
	}

	projectSummaries := make([]dashboardProjectResponse, 0, len(projects))
	for _, project := range projects {
		var projectTaskCount int64
		if err := models.DB.Model(&models.Task{}).Where("project_id = ?", project.ProjectID).Count(&projectTaskCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute project task counts"})
			return
		}

		var projectCompletedTaskCount int64
		if err := models.DB.Model(&models.Task{}).Where("project_id = ? AND progress IN ?", project.ProjectID, []models.Status{models.DONE, models.COMPLETED}).Count(&projectCompletedTaskCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute project task counts"})
			return
		}

		projectSummaries = append(projectSummaries, dashboardProjectResponse{
			ID:                 project.ProjectID.String(),
			Name:               project.Name,
			Description:        project.Description,
			TaskCount:          projectTaskCount,
			CompletedTaskCount: projectCompletedTaskCount,
		})
	}

	var recentTasks []models.Task
	if err := models.DB.
		Preload("AssignedMember").
		Preload("Project").
		Order("created_at DESC").
		Limit(6).
		Find(&recentTasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't fetch recent tasks"})
		return
	}

	mappedRecentTasks := make([]taskResponse, 0, len(recentTasks))
	for _, task := range recentTasks {
		mappedRecentTasks = append(mappedRecentTasks, mapTask(task))
	}

	c.JSON(http.StatusOK, dashboardResponse{
		Stats: dashboardStatsResponse{
			TotalTasks:      totalTasks,
			TasksDone:       tasksDone,
			TasksInProgress: tasksInProgress,
			TotalMembers:    totalMembers,
			TotalProjects:   totalProjects,
		},
		Projects:    projectSummaries,
		RecentTasks: mappedRecentTasks,
	})
}
