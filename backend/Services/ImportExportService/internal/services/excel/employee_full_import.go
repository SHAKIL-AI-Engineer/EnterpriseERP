package excelsvc

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/xuri/excelize/v2"
)

// EmployeeFullImportRow matches HRService EmployeeImportRowDto (camelCase JSON).
type EmployeeFullImportRow struct {
	RowIndex                 int       `json:"rowIndex"`
	PunchNumber              int       `json:"punchNumber"`
	EmployeeID               string    `json:"employeeID"`
	FullName                 string    `json:"fullName"`
	BanglaName               string    `json:"banglaName,omitempty"`
	Gender                   string    `json:"gender,omitempty"`
	Religion                 string    `json:"religion,omitempty"`
	BloodGroup               string    `json:"bloodGroup,omitempty"`
	DateOfBirth              *string   `json:"dateOfBirth,omitempty"`
	NationalId               string    `json:"nationalId,omitempty"`
	BirthCertificateNo       string    `json:"birthCertificateNo,omitempty"`
	Phone                    string    `json:"phone,omitempty"`
	Email                    string    `json:"email,omitempty"`
	JoinDate                 time.Time `json:"joinDate"`
	EmploymentType           string    `json:"employmentType"`
	Status                   string    `json:"status"`
	IsOtEnabled              bool      `json:"isOtEnabled"`
	DepartmentName           string    `json:"departmentName,omitempty"`
	SectionName              string    `json:"sectionName,omitempty"`
	DesignationName          string    `json:"designationName,omitempty"`
	GradeName                string    `json:"gradeName,omitempty"`
	GroupName                string    `json:"groupName,omitempty"`
	LineName                 string    `json:"lineName,omitempty"`
	SupervisorEmployeeID     string    `json:"supervisorEmployeeID,omitempty"`
	BasicSalary              float64   `json:"basicSalary"`
	HouseRent                float64   `json:"houseRent"`
	MedicalAllowance         float64   `json:"medicalAllowance"`
	ConveyanceAllowance      float64   `json:"conveyanceAllowance"`
	FoodAllowance            float64   `json:"foodAllowance"`
	FatherNameEn             string    `json:"fatherNameEn,omitempty"`
	FatherNameBn             string    `json:"fatherNameBn,omitempty"`
	MotherNameEn             string    `json:"motherNameEn,omitempty"`
	MotherNameBn             string    `json:"motherNameBn,omitempty"`
	MaritalStatus            string    `json:"maritalStatus,omitempty"`
	SpouseNameEn             string    `json:"spouseNameEn,omitempty"`
	SpouseNameBn             string    `json:"spouseNameBn,omitempty"`
	SpouseOccupation         string    `json:"spouseOccupation,omitempty"`
	SpouseContact            string    `json:"spouseContact,omitempty"`
	EducationLevel           string    `json:"educationLevel,omitempty"`
	Institution              string    `json:"institution,omitempty"`
	FieldOfStudy             string    `json:"fieldOfStudy,omitempty"`
	Skills                   string    `json:"skills,omitempty"`
	Reference1Name           string    `json:"reference1Name,omitempty"`
	Reference1Relation       string    `json:"reference1Relation,omitempty"`
	Reference1Phone          string    `json:"reference1Phone,omitempty"`
	Reference1Address        string    `json:"reference1Address,omitempty"`
	Reference2Name           string    `json:"reference2Name,omitempty"`
	Reference2Relation       string    `json:"reference2Relation,omitempty"`
	Reference2Phone          string    `json:"reference2Phone,omitempty"`
	Reference2Address        string    `json:"reference2Address,omitempty"`
	PresentDivision          string    `json:"presentDivision,omitempty"`
	PresentDistrict          string    `json:"presentDistrict,omitempty"`
	PresentUpazila           string    `json:"presentUpazila,omitempty"`
	PresentPostOffice        string    `json:"presentPostOffice,omitempty"`
	PresentPostalCode        string    `json:"presentPostalCode,omitempty"`
	PresentAddress           string    `json:"presentAddress,omitempty"`
	PermanentDivision        string    `json:"permanentDivision,omitempty"`
	PermanentDistrict        string    `json:"permanentDistrict,omitempty"`
	PermanentUpazila         string    `json:"permanentUpazila,omitempty"`
	PermanentPostOffice      string    `json:"permanentPostOffice,omitempty"`
	PermanentPostalCode      string    `json:"permanentPostalCode,omitempty"`
	PermanentAddress         string    `json:"permanentAddress,omitempty"`
	BankName                 string    `json:"bankName,omitempty"`
	BranchName               string    `json:"branchName,omitempty"`
	AccountNo                string    `json:"accountNo,omitempty"`
	RoutingNo                string    `json:"routingNo,omitempty"`
	BankAccountType          string    `json:"bankAccountType,omitempty"`
	MobileBankingNo          string    `json:"mobileBankingNo,omitempty"`
	EmergencyContactName     string    `json:"emergencyContactName,omitempty"`
	EmergencyContactRelation string    `json:"emergencyContactRelation,omitempty"`
	EmergencyContactPhone    string    `json:"emergencyContactPhone,omitempty"`
	EmergencyContactAddress  string    `json:"emergencyContactAddress,omitempty"`
	ProfileImageUrl          string    `json:"profileImageUrl,omitempty"`
	SignatureImageUrl        string    `json:"signatureImageUrl,omitempty"`
}

func ParseEmployeeFullImport(path string) ([]EmployeeFullImportRow, []dto.RowError, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	sheet := resolveEmployeeImportSheet(f)
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return nil, []dto.RowError{{Row: 0, Message: "empty sheet"}}, nil
	}

	headerMap, herr := mapHeaders(rows[0], EmployeeFullHeaders)
	if len(herr) > 0 {
		var re []dto.RowError
		for _, m := range herr {
			re = append(re, dto.RowError{Row: 1, Message: m})
		}
		return nil, re, nil
	}

	seenEmployeeIDs := map[string]struct{}{}
	seenPunchNumbers := map[int]struct{}{}
	var out []EmployeeFullImportRow
	var errs []dto.RowError

	for i := 1; i < len(rows); i++ {
		r := rows[i]
		if rowEmpty(r) {
			continue
		}
		excelRow := i + 1
		get := func(name string) string {
			idx, ok := headerMap[name]
			if !ok || idx >= len(r) {
				return ""
			}
			return strings.TrimSpace(r[idx])
		}

		er := EmployeeFullImportRow{RowIndex: excelRow, IsOtEnabled: true, EmploymentType: "Permanent", Status: "Active"}
		missing := []string{}

		rawPunch := get("PunchNumber")
		if rawPunch == "" {
			missing = append(missing, "PunchNumber")
		} else {
			v, e := strconv.Atoi(strings.TrimSpace(rawPunch))
			if e != nil || v <= 0 {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "PunchNumber", Message: "must be a positive integer"})
			} else {
				er.PunchNumber = v
			}
		}

		er.EmployeeID = get("EmployeeID")
		if er.EmployeeID == "" {
			missing = append(missing, "EmployeeID")
		}
		er.FullName = get("FullName")
		if er.FullName == "" {
			missing = append(missing, "FullName")
		}

		er.DepartmentName = get("DepartmentName")
		if er.DepartmentName == "" {
			missing = append(missing, "DepartmentName")
		}
		er.DesignationName = get("DesignationName")
		if er.DesignationName == "" {
			missing = append(missing, "DesignationName")
		}

		rawDate := get("JoinDate")
		if rawDate == "" {
			missing = append(missing, "JoinDate")
		} else {
			t, perr := parseExcelDate(rawDate, f, sheet, excelRow, headerMap["JoinDate"]+1)
			if perr != nil {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "JoinDate", Message: perr.Error()})
			} else {
				er.JoinDate = t
			}
		}

		er.Status = get("Status")
		if er.Status == "" {
			missing = append(missing, "Status")
		}
		if strings.EqualFold(strings.TrimSpace(er.Status), "Inactive") {
			errs = append(errs, dto.RowError{Row: excelRow, Message: "inactive employee rows are not processed"})
		}

		for _, m := range missing {
			errs = append(errs, dto.RowError{Row: excelRow, Column: m, Message: "required"})
		}

		if hasRowError(errs, excelRow) {
			continue
		}

		er.BanglaName = get("BanglaName")
		er.Gender = get("Gender")
		er.Religion = get("Religion")
		er.BloodGroup = get("BloodGroup")
		if dob := get("DateOfBirth"); dob != "" {
			if t, perr := parseExcelDate(dob, f, sheet, excelRow, headerMap["DateOfBirth"]+1); perr == nil {
				s := t.Format("2006-01-02")
				er.DateOfBirth = &s
			}
		}
		er.NationalId = get("NationalId")
		er.BirthCertificateNo = get("BirthCertificateNo")
		er.Phone = get("Phone")
		er.Email = get("Email")
		if et := get("EmploymentType"); et != "" {
			er.EmploymentType = et
		}
		er.IsOtEnabled = parseBoolDefault(get("IsOtEnabled"), true)
		er.SectionName = get("SectionName")
		er.GradeName = get("GradeName")
		er.GroupName = get("GroupName")
		er.LineName = get("LineName")
		er.SupervisorEmployeeID = get("SupervisorEmployeeID")
		er.BasicSalary = parseFloat(get("BasicSalary"))
		er.HouseRent = parseFloat(get("HouseRent"))
		er.MedicalAllowance = parseFloat(get("MedicalAllowance"))
		er.ConveyanceAllowance = parseFloat(get("ConveyanceAllowance"))
		er.FoodAllowance = parseFloat(get("FoodAllowance"))
		er.FatherNameEn = get("FatherNameEn")
		er.FatherNameBn = get("FatherNameBn")
		er.MotherNameEn = get("MotherNameEn")
		er.MotherNameBn = get("MotherNameBn")
		er.MaritalStatus = get("MaritalStatus")
		er.SpouseNameEn = get("SpouseNameEn")
		er.SpouseNameBn = get("SpouseNameBn")
		er.SpouseOccupation = get("SpouseOccupation")
		er.SpouseContact = get("SpouseContact")
		er.EducationLevel = get("EducationLevel")
		er.Institution = get("Institution")
		er.FieldOfStudy = get("FieldOfStudy")
		er.Skills = get("Skills")
		er.Reference1Name = get("Reference1Name")
		er.Reference1Relation = get("Reference1Relation")
		er.Reference1Phone = get("Reference1Phone")
		er.Reference1Address = get("Reference1Address")
		er.Reference2Name = get("Reference2Name")
		er.Reference2Relation = get("Reference2Relation")
		er.Reference2Phone = get("Reference2Phone")
		er.Reference2Address = get("Reference2Address")
		er.PresentDivision = get("PresentDivision")
		er.PresentDistrict = get("PresentDistrict")
		er.PresentUpazila = get("PresentUpazila")
		er.PresentPostOffice = get("PresentPostOffice")
		er.PresentPostalCode = get("PresentPostalCode")
		er.PresentAddress = get("PresentAddress")
		er.PermanentDivision = get("PermanentDivision")
		er.PermanentDistrict = get("PermanentDistrict")
		er.PermanentUpazila = get("PermanentUpazila")
		er.PermanentPostOffice = get("PermanentPostOffice")
		er.PermanentPostalCode = get("PermanentPostalCode")
		er.PermanentAddress = get("PermanentAddress")
		er.BankName = get("BankName")
		er.BranchName = get("BranchName")
		er.AccountNo = get("AccountNo")
		er.RoutingNo = get("RoutingNo")
		er.BankAccountType = get("BankAccountType")
		er.MobileBankingNo = get("MobileBankingNo")
		er.EmergencyContactName = get("EmergencyContactName")
		er.EmergencyContactRelation = get("EmergencyContactRelation")
		er.EmergencyContactPhone = get("EmergencyContactPhone")
		er.EmergencyContactAddress = get("EmergencyContactAddress")
		er.ProfileImageUrl = get("ProfileImageUrl")
		er.SignatureImageUrl = get("SignatureImageUrl")

		key := strings.ToUpper(er.EmployeeID)
		if _, dup := seenEmployeeIDs[key]; dup {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "EmployeeID", Message: "duplicate within file"})
		} else {
			seenEmployeeIDs[key] = struct{}{}
		}
		if _, dup := seenPunchNumbers[er.PunchNumber]; dup {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "PunchNumber", Message: "duplicate within file"})
		} else {
			seenPunchNumbers[er.PunchNumber] = struct{}{}
		}

		if hasRowError(errs, excelRow) {
			continue
		}
		out = append(out, er)
	}

	return out, errs, nil
}

func resolveEmployeeImportSheet(f *excelize.File) string {
	if name := findSheet(f, "Template", "Employee", "Employees", "Data"); name != "" {
		return name
	}
	return f.GetSheetName(0)
}

func parseFloat(raw string) float64 {
	raw = strings.TrimSpace(strings.ReplaceAll(raw, ",", ""))
	if raw == "" {
		return 0
	}
	v, _ := strconv.ParseFloat(raw, 64)
	return v
}

func parseBoolDefault(raw string, def bool) bool {
	raw = strings.TrimSpace(strings.ToLower(raw))
	if raw == "" {
		return def
	}
	switch raw {
	case "1", "true", "yes", "y":
		return true
	case "0", "false", "no", "n":
		return false
	default:
		return def
	}
}

// ExportEmployeesFullExcel writes rows using EmployeeFullHeaders.
func ExportEmployeesFullExcel(rows []EmployeeFullImportRow) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Template"
	_ = f.SetSheetName("Sheet1", sheet)
	for i, h := range EmployeeFullHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	style, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	lastCol, _ := excelize.ColumnNumberToName(len(EmployeeFullHeaders))
	_ = f.SetCellStyle(sheet, "A1", lastCol+"1", style)
	_ = freezeTopRow(f, sheet)

	for ri, row := range rows {
		r := ri + 2
		set := func(col string, val any) {
			idx, ok := headerIndex(EmployeeFullHeaders, col)
			if !ok {
				return
			}
			cell, _ := excelize.CoordinatesToCellName(idx+1, r)
			_ = f.SetCellValue(sheet, cell, val)
		}
		set("PunchNumber", row.PunchNumber)
		set("EmployeeID", row.EmployeeID)
		set("FullName", row.FullName)
		set("BanglaName", row.BanglaName)
		set("Gender", row.Gender)
		set("Religion", row.Religion)
		set("BloodGroup", row.BloodGroup)
		if row.DateOfBirth != nil {
			set("DateOfBirth", *row.DateOfBirth)
		}
		set("NationalId", row.NationalId)
		set("BirthCertificateNo", row.BirthCertificateNo)
		set("Phone", row.Phone)
		set("Email", row.Email)
		set("JoinDate", row.JoinDate.Format("2006-01-02"))
		set("EmploymentType", row.EmploymentType)
		set("Status", row.Status)
		set("IsOtEnabled", row.IsOtEnabled)
		set("DepartmentName", row.DepartmentName)
		set("SectionName", row.SectionName)
		set("DesignationName", row.DesignationName)
		set("GradeName", row.GradeName)
		set("GroupName", row.GroupName)
		set("LineName", row.LineName)
		set("SupervisorEmployeeID", row.SupervisorEmployeeID)
		set("BasicSalary", row.BasicSalary)
		set("HouseRent", row.HouseRent)
		set("MedicalAllowance", row.MedicalAllowance)
		set("ConveyanceAllowance", row.ConveyanceAllowance)
		set("FoodAllowance", row.FoodAllowance)
		set("FatherNameEn", row.FatherNameEn)
		set("FatherNameBn", row.FatherNameBn)
		set("MotherNameEn", row.MotherNameEn)
		set("MotherNameBn", row.MotherNameBn)
		set("MaritalStatus", row.MaritalStatus)
		set("SpouseNameEn", row.SpouseNameEn)
		set("SpouseNameBn", row.SpouseNameBn)
		set("SpouseOccupation", row.SpouseOccupation)
		set("SpouseContact", row.SpouseContact)
		set("EducationLevel", row.EducationLevel)
		set("Institution", row.Institution)
		set("FieldOfStudy", row.FieldOfStudy)
		set("Skills", row.Skills)
		set("Reference1Name", row.Reference1Name)
		set("Reference1Relation", row.Reference1Relation)
		set("Reference1Phone", row.Reference1Phone)
		set("Reference1Address", row.Reference1Address)
		set("Reference2Name", row.Reference2Name)
		set("Reference2Relation", row.Reference2Relation)
		set("Reference2Phone", row.Reference2Phone)
		set("Reference2Address", row.Reference2Address)
		set("PresentDivision", row.PresentDivision)
		set("PresentDistrict", row.PresentDistrict)
		set("PresentUpazila", row.PresentUpazila)
		set("PresentPostOffice", row.PresentPostOffice)
		set("PresentPostalCode", row.PresentPostalCode)
		set("PresentAddress", row.PresentAddress)
		set("PermanentDivision", row.PermanentDivision)
		set("PermanentDistrict", row.PermanentDistrict)
		set("PermanentUpazila", row.PermanentUpazila)
		set("PermanentPostOffice", row.PermanentPostOffice)
		set("PermanentPostalCode", row.PermanentPostalCode)
		set("PermanentAddress", row.PermanentAddress)
		set("BankName", row.BankName)
		set("BranchName", row.BranchName)
		set("AccountNo", row.AccountNo)
		set("RoutingNo", row.RoutingNo)
		set("BankAccountType", row.BankAccountType)
		set("MobileBankingNo", row.MobileBankingNo)
		set("EmergencyContactName", row.EmergencyContactName)
		set("EmergencyContactRelation", row.EmergencyContactRelation)
		set("EmergencyContactPhone", row.EmergencyContactPhone)
		set("EmergencyContactAddress", row.EmergencyContactAddress)
		set("ProfileImageUrl", row.ProfileImageUrl)
		set("SignatureImageUrl", row.SignatureImageUrl)
	}

	idx, _ := f.GetSheetIndex(sheet)
	f.SetActiveSheet(idx)
	return f, nil
}

func headerIndex(headers []string, name string) (int, bool) {
	for i, h := range headers {
		if strings.EqualFold(h, name) {
			return i, true
		}
	}
	return 0, false
}

// SampleEmployeeFullRows returns demo rows for template/export fallback.
func SampleEmployeeFullRows() []EmployeeFullImportRow {
	join := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)
	dob := "1990-05-20"
	return []EmployeeFullImportRow{
		{
			RowIndex: 2, PunchNumber: 1, EmployeeID: "EMP-0001", FullName: "Karim Hasan",
			BanglaName: "করিম হাসান", Gender: "Male", Religion: "Islam", BloodGroup: "B+",
			DateOfBirth: &dob, Phone: "01700000000", Email: "karim@example.com",
			JoinDate: join, EmploymentType: "Permanent", Status: "Active", IsOtEnabled: true,
			DepartmentName: "HR", SectionName: "Admin", DesignationName: "Executive",
			BasicSalary: 35000, HouseRent: 12000, MedicalAllowance: 3000, ConveyanceAllowance: 3000, FoodAllowance: 2000,
		},
	}
}

// BuildEmployeeFullDemoTemplate Instructions + Template + Sample sheets.
func BuildEmployeeFullDemoTemplate() (*excelize.File, error) {
	f, err := ExportEmployeesFullExcel(SampleEmployeeFullRows())
	if err != nil {
		return nil, err
	}
	inst := "Instructions"
	f.NewSheet(inst)
	_ = f.SetCellValue(inst, "A1", "Employee Import Template (full profile)")
	_ = f.SetCellValue(inst, "A3", "1. Fill the Template sheet. Same EmployeeID in your company = UPDATE; new EmployeeID = CREATE.")
	_ = f.SetCellValue(inst, "A4", "2. Use the active company selected in hrhub (X-Company-Id). Organogram names must match Company Service.")
	_ = f.SetCellValue(inst, "A5", "3. Inactive rows are rejected. Preview then Confirm import.")
	_ = f.SetCellValue(inst, "A6", fmt.Sprintf("4. %d columns — export employees to get a filled template.", len(EmployeeFullHeaders)))

	sample := "Sample"
	f.NewSheet(sample)
	tplRows, _ := f.GetRows("Template")
	for i, row := range tplRows {
		for j, cell := range row {
			c, _ := excelize.CoordinatesToCellName(j+1, i+1)
			_ = f.SetCellValue(sample, c, cell)
		}
	}

	idx, _ := f.GetSheetIndex("Template")
	f.SetActiveSheet(idx)
	return f, nil
}
