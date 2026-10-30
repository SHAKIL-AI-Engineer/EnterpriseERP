# Enterprise ERP — Architecture, Data Flow & ERD

Downloadable diagram pack for **EnterpriseERP**. Open `.mmd` files in [Mermaid Live Editor](https://mermaid.live) or use `diagrams-viewer.html` in a browser (Print → Save as PDF).

---

## 1. System overview

```mermaid
flowchart TB
    subgraph Client
        UI[hrhub Next.js :3000]
    end

    subgraph Platform["Platform.Host :5000"]
        GW[API /api/v1/*]
        AUTH[AuthService]
        CO[CompanyService]
        HR[HRService]
        ATT[AttendanceService]
        SH[ShiftService]
        LV[LeaveService]
        PR[PayrollService]
        NT[NotificationService]
        AC[AccountsService]
        Others[Quality / Finishing / Security / ...]
    end

    subgraph GoServices
        PD[PunchDataService :5050]
        IE[ImportExportService]
    end

    subgraph Data
        SQL[(SQL Server)]
        Redis[(Redis :6379)]
        RMQ[(RabbitMQ optional)]
    end

    UI -->|JWT + X-Company-Id| GW
    GW --> AUTH & CO & HR & ATT & SH & LV & PR
    GW -->|YARP proxy| PD & IE
    ATT -->|HTTP shifts/evaluation| SH
    PR -->|HTTP approved monthly attendance| ATT
    PR -->|HTTP employee salary| HR
    ATT -->|read PunchRecords| PD
    AUTH & CO & HR & ATT & SH & PR --> SQL
    PD --> SQL
```

---

## 2. End-to-end data flow (HR → punch → payroll)

```mermaid
sequenceDiagram
    participant Device as ZKTeco / Manual upload
    participant PD as PunchDataService
    participant ATT as AttendanceService
    participant SH as ShiftService
    participant HR as HRService
    participant PR as PayrollService
    participant UI as hrhub

    Device->>PD: Raw log / device sync
    PD->>PD: Parse → PunchRecord (dedupe)
    PD-->>ATT: PunchLogCollected event (optional)

    UI->>ATT: Process daily attendance (company, date)
    ATT->>HR: Employee list (PunchNumber, EmployeeID)
    ATT->>PD: PunchRecords by company + date range
    ATT->>SH: GET shifts/evaluation?companyId&employeeId&date
    SH-->>ATT: ShiftEvaluationDto (window, policy, holiday/off)
    ATT->>ATT: DailyAttendance (In/Out, late, OT, status)
    UI->>ATT: Approve daily / monthly attendance

    UI->>PR: Run monthly payroll
    PR->>ATT: Approved monthly summary
    PR->>HR: EmployeeSalary (if not in Payroll DB)
    PR->>PR: EmployeePayroll (gross, deductions, net)
```

---

## 3. ERD (core HR, attendance, shift, payroll)

```mermaid
erDiagram
    Company ||--o{ Employee : employs
    Company ||--o{ Shift : defines
    Company ||--o{ EmployeeShiftAssignment : assigns
    Company ||--o{ TemporaryShiftAssignment : overrides
    Shift ||--|| ShiftRule : has
    Shift ||--o{ ShiftBreak : has
    Employee ||--o{ EmployeeShiftAssignment : roster
    Employee ||--o{ TemporaryShiftAssignment : temp
    Employee ||--o{ DailyAttendance : daily
    Shift ||--o{ DailyAttendance : evaluated_on
    Employee ||--o{ EmployeeSalary : payroll_salary
    Employee ||--o{ EmployeePayroll : monthly_pay
    CompanyPayrollPolicyAssignment }o--|| PayrollPolicyTemplate : uses
    PunchMachine ||--o{ PunchRecord : generates
    PunchLogFile ||--o{ PunchRecord : contains
    AppUser ||--o{ UserCompanyAccess : tenant
    AppRole ||--o{ AppUser : roles

    Company {
        guid Id PK
        string CompanyNameEn
    }

    Employee {
        guid Id PK
        guid CompanyId
        int PunchNumber
        string EmployeeID
        string FullName
        bool IsOtEnabled
    }

    Shift {
        guid Id PK
        guid CompanyId
        string ShiftName
        time StartTime
        time EndTime
        bool IsCrossDay
        bool IsDefault
    }

    ShiftRule {
        guid Id PK
        guid ShiftId
        int LateAfterMinutes
        int AllowOvertime
        int MaximumOvertimeMinutes
    }

    EmployeeShiftAssignment {
        guid Id PK
        guid EmployeeId
        guid ShiftId
        date EffectiveFrom
        bool IsCurrent
    }

    TemporaryShiftAssignment {
        guid Id PK
        guid EmployeeId
        guid ShiftId
        date ShiftDate
    }

    PunchRecord {
        guid Id PK
        int CompanyId
        int PunchNumber
        datetime PunchTime
        guid DeviceId
    }

    DailyAttendance {
        guid Id PK
        guid CompanyId
        guid EmployeeId
        date AttendanceDate
        guid ShiftId
        datetime InTime
        datetime OutTime
        int LateMinutes
        int OvertimeMinutes
        string Status
        bool IsApproved
    }

    EmployeeSalary {
        guid Id PK
        guid EmployeeId
        decimal GrossSalary
        string SalaryCalculationType
    }

    EmployeePayroll {
        guid Id PK
        guid EmployeeId
        int YearNo
        int MonthNo
        decimal NetSalary
        decimal OvertimeAmount
    }

    AppUser {
        guid Id PK
        string UserName
        string Email
    }
```

---

## 4. Shift selection & evaluation

```mermaid
flowchart TD
    A[Attendance date + employee] --> B{Temporary shift for date?}
    B -->|Yes| T[Use TemporaryShiftAssignment]
    B -->|No| C{Current roster assignment?}
    C -->|Yes| R[Use EmployeeShiftAssignment]
    C -->|No| D{Default company shift?}
    D -->|Yes| G[Use Shift IsDefault]
    D -->|No| F[Fallback shift]
    T & R & G & F --> E[ShiftEvaluationService]
    E --> W[Punch window Start/End]
    E --> P[ShiftRule: late, OT, grace]
    E --> H[Holiday / WeeklyOff from Leave calendar]
    W & P & H --> OUT[ShiftEvaluationDto to Attendance]
```

---

## 5. Daily attendance processing

```mermaid
flowchart LR
    A[Process day API] --> B[Map Company GUID → PunchData CompanyId]
    B --> C[Load employees from HR]
    C --> D[Load punches from PunchData]
    D --> E[For each employee]
    E --> F[Shift evaluation API]
    F --> G[Filter punches in punch window]
    G --> H[AttendanceProcessingService]
    H --> I[Upsert DailyAttendance]
    I --> J[Status: Present / Late / Absent / Holiday]
    J --> K[Approve → IsApproved = true]
    K --> L[Monthly rollup for payroll]
```

---

## 6. Salary calculation

```mermaid
flowchart TB
    subgraph Inputs
        POL[PayrollPolicyTemplate + Company assignment]
        SAL[EmployeeSalary]
        ATT[Approved AttendanceSummary]
        ADV[Advances / loans / manual bills]
    end

    subgraph Calc["PayrollCalculationService"]
        MODE{SalaryCalculationType}
        MODE -->|Monthly| M[Gross − absent − LWP]
        MODE -->|Daily| D[Per-day × present days]
        MODE -->|Hourly| H[Hourly rate × hours]
        OT[OvertimeCalculationService]
        BON[BonusCalculationService]
        M & D & H --> OT
        OT --> NET[Net = earnings − deductions]
        BON --> NET
    end

    subgraph Output
        EP[EmployeePayroll per month]
    end

    POL --> Calc
    SAL --> Calc
    ATT --> Calc
    ADV --> Calc
    Calc --> EP
```

---

## 7. Connection setup flow

```mermaid
flowchart LR
    subgraph Config
        CS[connectionstrings.json]
        ENV[hrhub .env.local]
    end

    subgraph Build
        BLD[dotnet build]
        COPY[Copy to Platform.Host bin]
    end

    subgraph Run
        SQL[(SQL Server)]
        BE[Platform.Host :5000]
        FE[yarn dev :3000]
    end

    CS --> BLD --> COPY --> BE
    BE --> SQL
    ENV --> FE
    FE -->|NEXT_PUBLIC_API_URL| BE
```

---

## Database map

| Service | Database |
|---------|----------|
| Auth | AuthServiceDB |
| Company | CompanyServiceDB |
| HR | HRServiceDB |
| Shift | ShiftServiceDB |
| Attendance | AttendanceServiceDB |
| PunchData | PunchDataDB |
| Payroll | PayrollServiceDB |
| Leave | LeaveServiceDB |

---

## Files in this pack

| File | Description |
|------|-------------|
| `diagrams/01-system-overview.mmd` | Architecture |
| `diagrams/02-data-flow-sequence.mmd` | Punch → payroll sequence |
| `diagrams/03-erd-core.mmd` | Entity relationship |
| `diagrams/04-shift-selection.mmd` | Shift logic |
| `diagrams/05-attendance-process.mmd` | Daily attendance |
| `diagrams/06-salary-calculation.mmd` | Payroll calc |
| `diagrams/07-connection-setup.mmd` | Config & run |
| `diagrams-viewer.html` | Browser viewer + Print to PDF |
