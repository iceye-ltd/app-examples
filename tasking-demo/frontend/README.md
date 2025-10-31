# Frontend Components

React components for the ICEYE Tasking Demo.

---

## Component Architecture

```
src/
├── App.jsx (Main orchestrator)
│   ├── ContractSelection.jsx
│   ├── TaskCreation.jsx
│   │   └── MapPicker.jsx
│   └── TaskMonitoring.jsx
│       ├── TaskTimeline.jsx
│       ├── TaskDetails.jsx
│       └── TaskProducts.jsx
└── main.jsx (React entry point)
```

---

## Components

### `App.jsx`
**Purpose:** Main application orchestrator managing the 3-step workflow.

**Workflow:**
1. Select Contract → 2. Create Task → 3. Monitor Task

**State:**
- `step` - Current workflow step (1, 2, or 3)
- `selectedContract` - User's selected contract
- `createdTask` - Created task object

---

### `ContractSelection.jsx`
**Purpose:** Display available contracts and handle selection.

**Key Features:**
- Fetches contracts from backend API
- Grid layout with contract cards
- Shows priority, SLA, and imaging modes
- Loading and error states

**Props:**
- `onContractSelected(contract)` - Called when user selects a contract

---

### `TaskCreation.jsx`
**Purpose:** Form for creating a new satellite tasking request.

**Key Features:**
- Interactive map for location selection
- Manual lat/lon inputs for precision
- Imaging mode dropdown
- Acquisition window date pickers
- Optional reference field
- Advanced parameters (incidence angle, look side, pass direction, priority, SLA)
- Expandable map mode

**Props:**
- `contract` - Selected contract object
- `onTaskCreated(task)` - Called when task is successfully created
- `onBack()` - Called when user clicks back button

**Uses:** `MapPicker` component

---

### `MapPicker.jsx`
**Purpose:** Interactive map for selecting geographic locations.

**Key Features:**
- Click to set location
- Draggable marker
- Geocoding search (search by city name)
- Syncs with parent form inputs
- Expandable fullscreen mode
- Uses free OpenStreetMap (no API key needed)

**Props:**
- `latitude` - Current latitude
- `longitude` - Current longitude
- `onChange(lat, lon)` - Called when location changes
- `isExpanded` - Fullscreen mode flag
- `onToggleExpand()` - Toggle fullscreen mode

---

### `TaskMonitoring.jsx`
**Purpose:** Container for task monitoring. Handles polling and coordinates child components.

**Key Features:**
- Auto-refresh every 5 seconds
- Stops polling at terminal states (DONE, FAILED, etc.)
- Fetches task status and scene data
- Task cancellation
- Manual refresh button

**Props:**
- `task` - Task object to monitor
- `onReset()` - Called when user wants to create a new task

**Child Components:**
- `TaskTimeline` - Visual progress indicator
- `TaskDetails` - Task info and scene data
- `TaskProducts` - Product downloads

---

### `TaskTimeline.jsx`
**Purpose:** Visual progress indicator showing task lifecycle.

**Stages:**
1. **RECEIVED** - Task queued
2. **ACTIVE** - Satellite scheduled
3. **FULFILLED** - SLA products ready
4. **DONE** - All products ready

**Props:**
- `currentStatus` - Current task status (e.g., "ACTIVE", "FULFILLED")

**Handles:** Terminal states (CANCELED, FAILED, REJECTED) with error UI

---

### `TaskDetails.jsx`
**Purpose:** Display task configuration, scene details, and terminal states.

**Key Features:**
- Scene details card (shows planned vs actual capture data)
- Task configuration grid (all parameters)
- Terminal state messages

**Props:**
- `task` - Task object with configuration
- `scene` - Scene object with imaging parameters (optional)

**Note:** Scene data evolves - ACTIVE shows planned parameters, FULFILLED/DONE shows actual capture data.

---

### `TaskProducts.jsx`
**Purpose:** Manage and display task products (imagery files).

**Key Features:**
- Auto-loads when task reaches FULFILLED or DONE
- Product grid with download links
- STAC format support
- Loading and error states
- Retry on error

**Props:**
- `taskId` - Task ID to fetch products for
- `taskStatus` - Current task status

**Note:** FULFILLED = SLA products ready, DONE = all products ready.

---

## API Client

**File:** `lib/api.js`

Centralized API client for backend communication. All API calls go through here.

**Available Methods:**
```javascript
api.getContracts()              // Fetch all contracts
api.getContract(id)             // Fetch single contract
api.getContractSummary(id)      // Fetch contract summary
api.createTask(data)            // Create new task
api.getTask(id)                 // Fetch task status
api.getTaskProducts(id)         // Fetch task products
api.getTaskScene(id)            // Fetch scene details
api.cancelTask(id)              // Cancel a task
```

**Usage Example:**
```javascript
import { api } from '../lib/api'

const contracts = await api.getContracts()
const task = await api.createTask(taskData)
```

---

## Styling

Most components have their own CSS file following the same naming convention:

| Component | CSS File | Location |
|-----------|----------|----------|
| `App.jsx` | `App.css` | `src/` |
| Global styles | `index.css` | `src/` |
| `ContractSelection.jsx` | `ContractSelection.css` | `src/components/` |
| `TaskCreation.jsx` | `TaskCreation.css` | `src/components/` |
| `TaskMonitoring.jsx` | `TaskMonitoring.css` | `src/components/` |
| `MapPicker.jsx` | `MapPicker.css` | `src/components/` |
| `TaskTimeline.jsx` | `TaskTimeline.css` | `src/components/` |
| `TaskDetails.jsx` | (uses parent CSS) | `src/components/` |
| `TaskProducts.jsx` | (uses parent CSS) | `src/components/` |

**Note:** `TaskDetails` and `TaskProducts` are styled via their parent component's CSS (`TaskMonitoring.css`).

---

## Extending the Demo

### Adding a New Component

1. **Create component file:**
   ```bash
   touch src/components/MyComponent.jsx
   ```

2. **Create styles:**
   ```bash
   touch src/components/MyComponent.css
   ```

3. **Basic structure:**
   ```jsx
   import PropTypes from 'prop-types'
   import './MyComponent.css'

   function MyComponent({ prop1, prop2 }) {
     return (
       <div className="my-component">
         {/* Your component */}
       </div>
     )
   }

   MyComponent.propTypes = {
     prop1: PropTypes.string.isRequired,
     prop2: PropTypes.func,
   }

   export default MyComponent
   ```

4. **Import in parent:**
   ```jsx
   import MyComponent from './components/MyComponent'
   ```

5. **Document in this README**

### Customizing Existing Components

Each component is self-contained and easy to modify:

- **Change colors:** Edit the CSS file
- **Add fields:** Update the component's JSX and state
- **Change API calls:** Modify `lib/api.js`
- **Add validation:** Update form handlers

---

## File Structure

```
frontend/src/
├── App.jsx                        # Main app
├── App.css                        # App styles
├── main.jsx                       # React entry point
├── index.css                      # Global styles
├── components/
│   ├── ContractSelection.jsx      # Step 1: Select contract
│   ├── ContractSelection.css
│   ├── TaskCreation.jsx           # Step 2: Create task
│   ├── TaskCreation.css
│   ├── MapPicker.jsx              # Interactive map
│   ├── MapPicker.css
│   ├── TaskMonitoring.jsx         # Step 3: Monitor task
│   ├── TaskMonitoring.css
│   ├── TaskTimeline.jsx           # Progress indicator
│   ├── TaskTimeline.css
│   ├── TaskDetails.jsx            # Task info display (no CSS)
│   └── TaskProducts.jsx           # Product downloads (no CSS)
└── lib/
    └── api.js                     # API client
```

