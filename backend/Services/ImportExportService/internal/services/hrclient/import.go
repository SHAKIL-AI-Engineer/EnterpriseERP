package hrclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type EmployeeImportUpsertRequest struct {
	Rows []EmployeeFullImportRow `json:"rows"`
}

type EmployeeFullImportRow struct {
	RowIndex                 int     `json:"rowIndex"`
	PunchNumber              int     `json:"punchNumber"`
	EmployeeID               string  `json:"employeeID"`
	FullName                 string  `json:"fullName"`
	BanglaName               string  `json:"banglaName,omitempty"`
	Gender                   string  `json:"gender,omitempty"`
	Religion                 string  `json:"religion,omitempty"`
	BloodGroup               string  `json:"bloodGroup,omitempty"`
	DateOfBirth              *string `json:"dateOfBirth,omitempty"`
	NationalId               string  `json:"nationalId,omitempty"`
	BirthCertificateNo       string  `json:"birthCertificateNo,omitempty"`
	Phone                    string  `json:"phone,omitempty"`
	Email                    string  `json:"email,omitempty"`
	JoinDate                 string  `json:"joinDate"`
	EmploymentType           string  `json:"employmentType"`
	Status                   string  `json:"status"`
	IsOtEnabled              bool    `json:"isOtEnabled"`
	DepartmentName           string  `json:"departmentName,omitempty"`
	SectionName              string  `json:"sectionName,omitempty"`
	DesignationName          string  `json:"designationName,omitempty"`
	GradeName                string  `json:"gradeName,omitempty"`
	GroupName                string  `json:"groupName,omitempty"`
	LineName                 string  `json:"lineName,omitempty"`
	SupervisorEmployeeID     string  `json:"supervisorEmployeeID,omitempty"`
	BasicSalary              float64 `json:"basicSalary"`
	HouseRent                float64 `json:"houseRent"`
	MedicalAllowance         float64 `json:"medicalAllowance"`
	ConveyanceAllowance      float64 `json:"conveyanceAllowance"`
	FoodAllowance            float64 `json:"foodAllowance"`
	FatherNameEn             string  `json:"fatherNameEn,omitempty"`
	FatherNameBn             string  `json:"fatherNameBn,omitempty"`
	MotherNameEn             string  `json:"motherNameEn,omitempty"`
	MotherNameBn             string  `json:"motherNameBn,omitempty"`
	MaritalStatus            string  `json:"maritalStatus,omitempty"`
	SpouseNameEn             string  `json:"spouseNameEn,omitempty"`
	SpouseNameBn             string  `json:"spouseNameBn,omitempty"`
	SpouseOccupation         string  `json:"spouseOccupation,omitempty"`
	SpouseContact            string  `json:"spouseContact,omitempty"`
	EducationLevel           string  `json:"educationLevel,omitempty"`
	Institution              string  `json:"institution,omitempty"`
	FieldOfStudy             string  `json:"fieldOfStudy,omitempty"`
	Skills                   string  `json:"skills,omitempty"`
	Reference1Name           string  `json:"reference1Name,omitempty"`
	Reference1Relation       string  `json:"reference1Relation,omitempty"`
	Reference1Phone          string  `json:"reference1Phone,omitempty"`
	Reference1Address        string  `json:"reference1Address,omitempty"`
	Reference2Name           string  `json:"reference2Name,omitempty"`
	Reference2Relation       string  `json:"reference2Relation,omitempty"`
	Reference2Phone          string  `json:"reference2Phone,omitempty"`
	Reference2Address        string  `json:"reference2Address,omitempty"`
	PresentDivision          string  `json:"presentDivision,omitempty"`
	PresentDistrict          string  `json:"presentDistrict,omitempty"`
	PresentUpazila           string  `json:"presentUpazila,omitempty"`
	PresentPostOffice        string  `json:"presentPostOffice,omitempty"`
	PresentPostalCode        string  `json:"presentPostalCode,omitempty"`
	PresentAddress           string  `json:"presentAddress,omitempty"`
	PermanentDivision        string  `json:"permanentDivision,omitempty"`
	PermanentDistrict        string  `json:"permanentDistrict,omitempty"`
	PermanentUpazila         string  `json:"permanentUpazila,omitempty"`
	PermanentPostOffice      string  `json:"permanentPostOffice,omitempty"`
	PermanentPostalCode      string  `json:"permanentPostalCode,omitempty"`
	PermanentAddress         string  `json:"permanentAddress,omitempty"`
	BankName                 string  `json:"bankName,omitempty"`
	BranchName               string  `json:"branchName,omitempty"`
	AccountNo                string  `json:"accountNo,omitempty"`
	RoutingNo                string  `json:"routingNo,omitempty"`
	BankAccountType          string  `json:"bankAccountType,omitempty"`
	MobileBankingNo          string  `json:"mobileBankingNo,omitempty"`
	EmergencyContactName     string  `json:"emergencyContactName,omitempty"`
	EmergencyContactRelation string  `json:"emergencyContactRelation,omitempty"`
	EmergencyContactPhone    string  `json:"emergencyContactPhone,omitempty"`
	EmergencyContactAddress  string  `json:"emergencyContactAddress,omitempty"`
	ProfileImageUrl          string  `json:"profileImageUrl,omitempty"`
	SignatureImageUrl        string  `json:"signatureImageUrl,omitempty"`
}

type EmployeeImportUpsertResult struct {
	Created int                      `json:"created"`
	Updated int                      `json:"updated"`
	Failed  int                      `json:"failed"`
	Errors  []EmployeeImportRowError `json:"errors"`
}

type EmployeeImportRowError struct {
	RowIndex int    `json:"rowIndex"`
	Field    string `json:"field"`
	Message  string `json:"message"`
}

func (c *Client) ImportUpsert(ctx context.Context, bearer, companyID string, rows []EmployeeFullImportRow) (*EmployeeImportUpsertResult, error) {
	body, err := json.Marshal(EmployeeImportUpsertRequest{Rows: rows})
	if err != nil {
		return nil, err
	}
	url := c.BaseURL + "/hr/Employees/import-upsert"
	if strings.TrimSpace(companyID) != "" {
		url += "?companyId=" + companyID
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(bearer))

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var env apiEnvelope
		if err := json.Unmarshal(raw, &env); err == nil {
			if msg := firstErrorMessage(env); msg != "" {
				return nil, fmt.Errorf("%s", msg)
			}
		}
		return nil, fmt.Errorf("HR API %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}

	var env apiEnvelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, err
	}
	if !env.Success {
		return nil, fmt.Errorf("%s", firstErrorMessage(env))
	}
	var result EmployeeImportUpsertResult
	if len(env.Data) > 0 {
		if err := json.Unmarshal(env.Data, &result); err != nil {
			return nil, err
		}
	}
	return &result, nil
}

func (c *Client) GetEmployeesExport(ctx context.Context, bearer, companyID string) ([]EmployeeFullImportRow, error) {
	url := c.BaseURL + "/hr/Employees/export"
	if strings.TrimSpace(companyID) != "" {
		url += "?companyId=" + companyID
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(bearer))

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var env apiEnvelope
		if err := json.Unmarshal(raw, &env); err == nil {
			if msg := firstErrorMessage(env); msg != "" {
				return nil, fmt.Errorf("%s", msg)
			}
		}
		return nil, fmt.Errorf("HR API %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}

	var env apiEnvelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, err
	}
	if !env.Success {
		return nil, fmt.Errorf("%s", firstErrorMessage(env))
	}
	var rows []EmployeeFullImportRow
	if len(env.Data) > 0 {
		if err := json.Unmarshal(env.Data, &rows); err != nil {
			return nil, err
		}
	}
	return rows, nil
}
