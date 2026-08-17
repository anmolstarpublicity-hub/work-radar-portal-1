# Requirements Document

## Introduction

This feature adds a controlled, per-employee "assign task" capability to the Work Radar Portal. An Admin can toggle ON or OFF the ability for any individual employee (with `Employee Dashboard` access) to assign tasks to other employees. When toggled ON, the employee gains access to a task-assignment interface inside their own dashboard, where they can create and assign tasks — but only to users whose `dashboardAccess` is `Employee Dashboard` (i.e., neither Admins nor Managers). When toggled OFF, the permission is revoked and the assignment interface is hidden.

The feature reuses the existing `canAssignTask` boolean field on the Employee model and the existing `PermissionsModal` in `EmployeeManagement.jsx`. New work is focused on: exposing the permission toggle clearly in the Admin UI, adding a server-side authorization guard on the task-creation endpoints, surfacing an "Assign Task" section inside the Employee Dashboard when the permission is active, and filtering the assignee pool to employees only.

## Glossary

- **Admin**: A user whose `dashboardAccess` is `Admin Dashboard`. Has full system control.
- **Manager**: A user whose `dashboardAccess` is `Manager Dashboard`. Can assign tasks to their own team.
- **Employee**: A user whose `dashboardAccess` is `Employee Dashboard`. Normally cannot assign tasks unless the Admin grants the `canAssignTask` permission.
- **Assignee**: The employee who receives a task (the target of an assignment).
- **Assigner**: The employee who creates and sends a task (the source of an assignment).
- **Permission_Toggle**: The Admin-controlled boolean switch (`canAssignTask`) stored on an Employee document.
- **AssignTask_Permission**: The `canAssignTask: true` flag on an Employee document that authorises that employee to act as an Assigner.
- **Eligible_Assignee_Pool**: The set of users with `dashboardAccess === 'Employee Dashboard'`, excluding the Assigner themselves.
- **Task_Assignment_UI**: The "Assign Task" section rendered inside the Employee Dashboard when `canAssignTask` is `true`.
- **PermissionsModal**: The existing Admin modal in `EmployeeManagement.jsx` used to manage per-employee boolean permissions.
- **Portal**: The Work Radar Portal (React + Node.js full-stack application).

---

## Requirements

### Requirement 1: Admin Controls the Per-Employee Assignment Permission

**User Story:** As an Admin, I want to toggle the "Can Assign Tasks" permission on or off for any individual employee, so that I have fine-grained control over who can assign work to their peers.

#### Acceptance Criteria

1. WHEN the `PermissionsModal` opens for an employee, THE `PermissionsModal` SHALL initialise the "Can Assign Tasks" toggle from that employee's `canAssignTask` field value as loaded from the server at open time.
2. WHEN the Admin clicks the "Can Assign Tasks" toggle in the `PermissionsModal`, THE `PermissionsModal` SHALL change the displayed toggle state immediately (optimistic local state update).
3. WHEN the Admin saves permissions via the `PermissionsModal`, THE Portal SHALL persist all permission toggle values (including `canAssignTask`) to the employee record on the server, and THE Save button SHALL be disabled while the request is in-flight to prevent double-submission.
4. WHEN the save request succeeds, THE Portal SHALL display a success notification to the Admin that remains visible for at least 3 seconds.
5. IF the save request fails, THEN THE Portal SHALL display an error notification that remains visible for at least 3 seconds, AND THE `PermissionsModal` SHALL revert all optimistic toggle states back to the values that were loaded when the modal was opened.
6. THE `PermissionsModal` SHALL allow the Admin to independently set `canAssignTask` for each employee without affecting any other employee's permissions.

---

### Requirement 2: Backend Authorisation Guard for Employee Task Assignment

**User Story:** As a system, I want the server to enforce the `canAssignTask` permission before allowing an employee to create tasks, so that permission bypasses via direct API calls are prevented.

#### Acceptance Criteria

1. WHEN a request is made to `POST /api/tasks` or `POST /api/tasks/multiple`, THE `Task_Controller` SHALL verify that the requesting user has `canAssignTask === true` OR has `dashboardAccess` of `Manager Dashboard` or `Admin Dashboard`.
2. IF the requesting user has `dashboardAccess === 'Employee Dashboard'` AND `canAssignTask` is not strictly `true` (including `false`, `undefined`, or absent), THEN THE `Task_Controller` SHALL return HTTP 403 with the message `"You do not have permission to assign tasks."`.
3. IF an employee with `canAssignTask === true` provides an `assignedTo` value that does not correspond to an existing user in the database, THEN THE `Task_Controller` SHALL return HTTP 400 with the message `"Assigned user not found."`.
4. IF the `assignedTo` field references a user whose `dashboardAccess` is `Manager Dashboard` or `Admin Dashboard`, THEN THE `Task_Controller` SHALL return HTTP 400 with the message `"Tasks can only be assigned to employees."`.
5. IF an employee with `canAssignTask === true` provides an `assignedTo` value that equals the requesting user's own `_id`, THEN THE `Task_Controller` SHALL return HTTP 400 with the message `"You cannot assign a task to yourself."`.
6. WHEN a request is made to `POST /api/tasks/multiple` with a batch of tasks, THE `Task_Controller` SHALL validate all `assignedTo` values before persisting any task, and IF any task in the batch fails validation THEN THE `Task_Controller` SHALL reject the entire batch and return the first validation error without creating any tasks.
7. WHEN all tasks in a `POST /api/tasks/multiple` batch pass validation, THE `Task_Controller` SHALL persist all tasks atomically and return HTTP 201.

---

### Requirement 3: Employee Dashboard Exposes Task Assignment Section

**User Story:** As an Employee with the "Can Assign Tasks" permission, I want a dedicated "Assign Task" section in my dashboard, so that I can create and send tasks to my colleagues without needing admin or manager access.

#### Acceptance Criteria

1. WHILE the authenticated employee has `canAssignTask === true`, THE `EmployeeDashboard` SHALL render an "Assign Task" navigation item in the sidebar.
2. WHILE the authenticated employee has `canAssignTask === false`, THE `EmployeeDashboard` SHALL NOT render the "Assign Task" sidebar item or the Task_Assignment_UI.
3. WHEN the employee selects "Assign Task" from the sidebar, THE `EmployeeDashboard` SHALL render the `Task_Assignment_UI`.
4. THE `Task_Assignment_UI` SHALL display a searchable list of employees from the `Eligible_Assignee_Pool`.
5. THE `Task_Assignment_UI` SHALL allow the employee to fill in a task title (required, non-empty after whitespace trimming, max 100 characters), description (optional), start date (optional), due date (optional), and priority (Low / Medium / High, defaulting to Medium) for each task.
6. WHEN the employee clicks submit and an assignee is selected AND all task titles are non-empty, THE `Task_Assignment_UI` SHALL call `POST /api/tasks/multiple`.
7. WHEN the `POST /api/tasks/multiple` call succeeds, THE `Task_Assignment_UI` SHALL display a success toast.
8. IF the submission fails, THEN THE `Task_Assignment_UI` SHALL display an error toast with the server's error message.
9. IF the employee clicks submit without selecting an assignee OR with any task title empty or whitespace-only, THEN THE `Task_Assignment_UI` SHALL not submit the form and SHALL display inline validation errors indicating the missing fields.
10. IF the employee sets a due date that precedes the start date, THEN THE `Task_Assignment_UI` SHALL not submit the form and SHALL display an inline validation error on the due date field.
11. THE `Task_Assignment_UI` SHALL allow the employee to add multiple task entries for the same assignee and submit them all in a single request, with controls to add a new task entry and to remove any existing entry.

---

### Requirement 4: Eligible Assignee Pool Excludes Admins and Managers

**User Story:** As an Employee with assignment permission, I want the list of people I can assign tasks to to include only fellow employees, so that I cannot accidentally assign work to a Manager or Admin.

#### Acceptance Criteria

1. THE `Task_Assignment_UI` SHALL populate the assignee list exclusively with users whose `dashboardAccess` is `Employee Dashboard`, which inherently excludes all Admins and Managers.
2. THE `Task_Assignment_UI` SHALL exclude the currently authenticated employee from the assignee list.
3. WHEN a search term is entered (evaluated on each keystroke), THE `Task_Assignment_UI` SHALL filter the `Eligible_Assignee_Pool` by matching the employee's name or `employeeId` (case-insensitive substring match).
4. IF the `Eligible_Assignee_Pool` contains no eligible employees before any search term is entered, THEN THE `Task_Assignment_UI` SHALL display a message indicating no eligible employees are available.
5. IF the `Eligible_Assignee_Pool` is empty after applying a search filter, THEN THE `Task_Assignment_UI` SHALL display a message indicating no employees match the search term.
6. IF the data fetch for the assignee list fails, THEN THE `Task_Assignment_UI` SHALL display an error message indicating the list could not be loaded and SHALL NOT render a partial or stale list.

---

### Requirement 5: Permission Change Takes Effect Without Re-login

**User Story:** As an Admin, I want permission changes to take effect for the employee as soon as reasonably possible, so that I do not have to coordinate forced logouts when granting or revoking access.

#### Acceptance Criteria

1. WHEN the Admin saves a permission change for an employee, THE Portal SHALL immediately invalidate the `Employee` cache tag so that the next data fetch for that employee reflects the updated `canAssignTask` value from the server.
2. WHEN the employee's dashboard performs a data re-fetch triggered by a page refresh or an RTK Query cache invalidation, THE `EmployeeDashboard` SHALL show or hide the "Assign Task" section based on the latest `canAssignTask` value returned by the server.
3. IF an employee submits a task via the `Task_Assignment_UI` and the server determines that `canAssignTask` is not `true` for that employee at the time of submission, THEN THE `Task_Controller` SHALL return HTTP 403.
4. IF THE `Task_Assignment_UI` receives an HTTP 403 response on a task submission attempt, THEN THE `Task_Assignment_UI` SHALL display an error toast with the message `"You no longer have permission to assign tasks."`.
