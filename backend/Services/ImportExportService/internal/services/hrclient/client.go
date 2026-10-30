package hrclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// CreateEmployeeRequest matches HRService POST api/v1/hr/Employees JSON (camelCase).
type CreateEmployeeRequest struct {
	CompanyID            string  `json:"companyId"`
	PunchNumber          int     `json:"punchNumber"`
	EmployeeID           *string `json:"employeeID"`
	FullName             string  `json:"fullName"`
	BanglaName           *string `json:"banglaName"`
	Gender               *string `json:"gender"`
	DateOfBirth          *string `json:"dateOfBirth"`
	NationalID           *string `json:"nationalId"`
	BirthCertificateNo   *string `json:"birthCertificateNo"`
	Phone                *string `json:"phone"`
	Email                *string `json:"email"`
	JoinDate             string  `json:"joinDate"`
	EmploymentType       string  `json:"employmentType"`
	DepartmentID         string  `json:"departmentId"`
	SectionID            *string `json:"sectionId"`
	DesignationID        string  `json:"designationId"`
	GradeID              *string `json:"gradeId"`
	BasicSalary          float64 `json:"basicSalary"`
	HouseRent            float64 `json:"houseRent"`
	MedicalAllowance     float64 `json:"medicalAllowance"`
	ConveyanceAllowance  float64 `json:"conveyanceAllowance"`
	FoodAllowance        float64 `json:"foodAllowance"`
	IsOtEnabled          bool    `json:"isOtEnabled"`
}

type apiEnvelope struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
	Errors  []apiError      `json:"errors"`
	Message string          `json:"message"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		BaseURL: strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		HTTPClient: &http.Client{
			Timeout: 15 * time.Minute,
		},
	}
}

func (c *Client) CreateEmployee(ctx context.Context, bearer string, req CreateEmployeeRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/hr/Employees", bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(bearer))

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		var env apiEnvelope
		if err := json.Unmarshal(raw, &env); err == nil && !env.Success {
			return fmt.Errorf("%s", firstErrorMessage(env))
		}
		return nil
	}
	var env apiEnvelope
	if err := json.Unmarshal(raw, &env); err == nil {
		if msg := firstErrorMessage(env); msg != "" {
			return fmt.Errorf("%s", msg)
		}
	}
	return fmt.Errorf("HR API %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
}

func firstErrorMessage(env apiEnvelope) string {
	if len(env.Errors) > 0 && env.Errors[0].Message != "" {
		return env.Errors[0].Message
	}
	if env.Message != "" {
		return env.Message
	}
	return "request failed"
}
