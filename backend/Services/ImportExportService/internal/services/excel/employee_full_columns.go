package excelsvc

// EmployeeFullHeaders is the canonical import/export column order (round-trip with HR API).
var EmployeeFullHeaders = []string{
	"PunchNumber", "EmployeeID", "FullName", "BanglaName", "Gender", "Religion", "BloodGroup",
	"DateOfBirth", "NationalId", "BirthCertificateNo", "Phone", "Email", "JoinDate", "EmploymentType", "Status", "IsOtEnabled",
	"DepartmentName", "SectionName", "DesignationName", "GradeName", "GroupName", "LineName", "SupervisorEmployeeID",
	"BasicSalary", "HouseRent", "MedicalAllowance", "ConveyanceAllowance", "FoodAllowance",
	"FatherNameEn", "FatherNameBn", "MotherNameEn", "MotherNameBn", "MaritalStatus",
	"SpouseNameEn", "SpouseNameBn", "SpouseOccupation", "SpouseContact",
	"EducationLevel", "Institution", "FieldOfStudy", "Skills",
	"Reference1Name", "Reference1Relation", "Reference1Phone", "Reference1Address",
	"Reference2Name", "Reference2Relation", "Reference2Phone", "Reference2Address",
	"PresentDivision", "PresentDistrict", "PresentUpazila", "PresentPostOffice", "PresentPostalCode", "PresentAddress",
	"PermanentDivision", "PermanentDistrict", "PermanentUpazila", "PermanentPostOffice", "PermanentPostalCode", "PermanentAddress",
	"BankName", "BranchName", "AccountNo", "RoutingNo", "BankAccountType", "MobileBankingNo",
	"EmergencyContactName", "EmergencyContactRelation", "EmergencyContactPhone", "EmergencyContactAddress",
	"ProfileImageUrl", "SignatureImageUrl",
}
