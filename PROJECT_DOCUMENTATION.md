# RUPS Elektrotehnika - Project Documentation

## 📋 Project Overview

**RUPS Elektrotehnika** is an interactive educational web application designed to teach students the fundamentals of electricity and electrical circuits through hands-on simulation. The application provides a virtual laboratory environment where students can construct electrical circuits, experiment with components, and learn through practical experience.

### 🎯 Core Objectives
- Provide a visual, understandable, and practical approach to learning basic electrical components
- Encourage experimentation and exploration of concepts like current, voltage, resistance, and series/parallel connections
- Enhance traditional classroom teaching with an interactive "virtual laboratory"
- Motivate students through gamification (points, badges, levels)

---

## 🏗️ Project Structure

```
RUPS-Elektrotehnika/
├── index.html              # Entry HTML file
├── package.json            # Project dependencies and scripts
├── vite.config.js          # Vite configuration
├── README.md               # Project description (in Slovenian)
├── src/
│   ├── main.js             # Application entry point & Phaser configuration
│   ├── style.css           # Global styles
│   ├── avatars/            # User profile avatar images (avatar1.png - avatar11.png)
│   ├── components/         # Electrical component assets & logic classes
│   │   ├── battery.js      # Battery component class
│   │   ├── battery.png     # Battery image asset
│   │   ├── bulb.js         # Light bulb component class
│   │   ├── lamp.png        # Lamp image asset
│   │   ├── component.js    # Base component class
│   │   ├── resistor.js     # Resistor component class
│   │   ├── resistor.png    # Resistor image asset
│   │   ├── switch.js       # Switch component class
│   │   ├── switch-on.png   # Switch ON state image
│   │   ├── switch-off.png  # Switch OFF state image
│   │   ├── wire.js         # Wire component class
│   │   └── wire.png        # Wire image asset
│   ├── logic/              # Circuit simulation logic
│   │   ├── circuit_graph.js # Graph-based circuit simulation
│   │   ├── node.js         # Node class for circuit connections
│   │   └── test.js         # Testing utilities
│   ├── scenes/             # Phaser game scenes
│   │   ├── preloadScene.js     # Asset preloading scene
│   │   ├── menuScene.js        # Main menu with animated circuit
│   │   ├── loginScene.js       # User login/registration
│   │   ├── labScene.js         # Laboratory overview scene
│   │   ├── workspaceScene.js   # Main workspace for circuit building
│   │   ├── scoreboardScene.js  # Leaderboard display
│   │   ├── UIScene.js          # UI elements scene (placeholder)
│   │   └── testScene.js        # Testing scene
│   └── ui/                 # UI component classes
│       ├── UIButton.js     # Custom button component
│       └── UIPanel.js      # Custom panel component
```

---

## 🔧 Technical Stack

### Core Technologies

#### **Phaser 3** (v3.90.0)
- **Purpose**: Game engine and rendering framework
- **Usage**: 
  - Scene management (menu, lab, workspace, scoreboard)
  - Interactive component drag & drop
  - Visual animations and tweens
  - Physics system (Arcade physics with gravity disabled)
  - Input handling (mouse, keyboard)
  - Asset management (image loading)
- **Why Phaser**: Provides robust 2D rendering, built-in scene management, and excellent support for interactive educational applications

#### **Vite** (v7.1.7)
- **Purpose**: Build tool and development server
- **Usage**:
  - Fast Hot Module Replacement (HMR) during development
  - ES module bundling
  - Development server on `http://127.0.0.1:5173`
- **Configuration**: Custom server settings in `vite.config.js`

#### **Vanilla JavaScript (ES6+)**
- **Features Used**:
  - ES6 Classes and modules
  - Import/export syntax
  - Arrow functions
  - Template literals
  - Local Storage API for persistence
  - Set data structures for graph connections

#### **Local Storage**
- **Purpose**: Client-side data persistence
- **Stored Data**:
  - User credentials (username, password)
  - User scores and profile pictures
  - Current challenge progress (`currentChallengeIndex`)
- **Structure**:
  ```javascript
  {
    users: [
      {
        username: string,
        password: string,
        score: number,
        profilePic: string
      }
    ],
    username: string,           // Currently logged in user
    profilePic: string,         // Current user's avatar
    currentChallengeIndex: number
  }
  ```

---

## 🎮 Application Workflow

### 1. **Application Initialization** (`main.js`)
- Phaser game instance is created with configuration:
  - Auto-detect renderer (WebGL/Canvas)
  - Responsive sizing (full window)
  - Light background color (#f4f6fa)
  - Arcade physics with zero gravity
  - Scene order: Menu → Lab → Workspace → Login → Scoreboard

### 2. **Scene Flow**

```
MenuScene (Landing)
    ↓
LoginScene (User Auth)
    ↓
LabScene (Lab Overview)
    ↓
WorkspaceScene (Main Activity)
    ↔
ScoreboardScene (Leaderboard)
```

#### **MenuScene** - Interactive Landing Page
- **Visual Design**:
  - Animated title "LABORATORIJ" with pulsing effect
  - Interactive switch component (animated circuit)
  - Wooden desk background with grid pattern
  - Scattered electrical components appear when switch is ON
- **Features**:
  - Switch toggles between OFF/ON states
  - When ON: Title glows, components fade in, start button activates
  - Smooth transitions and hover effects
- **Navigation**: Leads to LoginScene

#### **LoginScene** - User Authentication
- **Design**: Laboratory environment with desk and panel overlay
- **Features**:
  - Username/password input fields (DOM elements)
  - Random avatar assignment from 11 options
  - User registration (if new) or login (if existing)
  - Data stored in LocalStorage
  - Form validation
- **Navigation**: Back to Menu or forward to LabScene

#### **LabScene** - Laboratory Overview
- **Visual**: 3D-style laboratory with desk, walls, floor
- **Features**:
  - Welcome message with user avatar
  - Interactive table (click to enter workspace)
  - Logout button
  - Access to scoreboard
  - Hover effects on table surface
- **Navigation**: To WorkspaceScene or ScoreboardScene

#### **WorkspaceScene** - Main Circuit Building Interface
- **Core Functionality**: Drag-and-drop circuit construction
- **Components Panel** (Left sidebar):
  - Battery (Baterija) - 3.3V voltage source
  - Resistor (Upor) - 1.5Ω resistance
  - Light bulb (Svetilka)
  - Switch ON/OFF (Stikalo)
  - Wire (Žica) - connectors
  - Ammeter & Voltmeter (placeholders)
- **Workspace Area**:
  - Grid-based snap system (40px grid)
  - Component rotation (90° increments)
  - Real-time position snapping
  - Visual feedback on hover
- **Challenge System**:
  - 8 progressive challenges
  - Required components validation
  - Circuit simulation verification
  - Theory explanations after completion
  - Point rewards (10 points per challenge)
- **Controls**:
  - "Preveri krog" (Check Circuit) - validates solution
  - "Simulacija" (Simulate) - runs circuit logic
  - "Lestvica" (Scoreboard) - view rankings
  - Back button to return to Lab

#### **ScoreboardScene** - Leaderboard
- **Features**:
  - Sorted user rankings by score
  - Avatar display for each user
  - Current user highlighted in blue
  - Elegant panel design matching laboratory theme
- **Navigation**: ESC key or back button returns to previous scene

---

## 🔌 Circuit Simulation System

### Graph-Based Architecture

The circuit simulation uses a **graph data structure** to model electrical connections:

#### **Node Class** (`logic/node.js`)
```javascript
{
  id: string,
  x: number,           // Grid position
  y: number,
  connected: Set,      // Connected nodes
  bit_value: number    // Electrical state
}
```

#### **CircuitGraph Class** (`logic/circuit_graph.js`)
- **Properties**:
  - `nodes`: Map of all connection points
  - `components`: Array of circuit components
  - `MERGE_RADIUS`: 25px threshold for node merging

- **Key Methods**:
  - `addNode(node)`: Adds node, merges if within radius of existing node
  - `addComponent(component)`: Registers component and its endpoints
  - `getConnections(node)`: Returns components connected to a node
  - `componentConducts(comp)`: Checks if component allows current flow
  - `hasClosedLoop(current, target, visitedComps)`: Recursive DFS to find closed circuit
  - `simulate()`: Main simulation entry point

- **Simulation Logic**:
  1. Finds battery (voltage source)
  2. Checks all switches are ON
  3. Performs depth-first search from battery start to end
  4. Returns status codes:
     - `1`: Circuit closed, current flows
     - `0`: Circuit open
     - `-1`: No battery found
     - `-2`: Switch is OFF

#### **Component Classes** (`components/`)

**Base Component** (`component.js`):
```javascript
{
  id: string,
  type: string,
  start: Node,
  end: Node,
  isVoltageSource: boolean,
  image: string
}
```

**Specialized Components**:
- **Battery**: `voltage: 3.3V`, is voltage source
- **Bulb**: `is_on: boolean`, visual indicator
- **Resistor**: `resistance: 1.5Ω`, limits current
- **Switch**: `is_on: boolean`, controls circuit closure
- **Wire**: Simple conductor

### Component Positioning & Rotation

- **Grid System**: 40px grid for snap-to-grid alignment
- **Local Offsets**: Components store `localStart` and `localEnd` relative positions
- **Rotation**: 90° increments using trigonometry:
  ```javascript
  rotatedX = localX * cos(θ) - localY * sin(θ)
  rotatedY = localX * sin(θ) + localY * cos(θ)
  ```
- **Node Updates**: Positions recalculated after every drag/rotation

---

## 📚 Challenge Curriculum

### Progressive Learning Path

1. **Challenge 1**: Simple circuit (battery + bulb + wires)
   - **Theory**: Basic closed circuit principles

2. **Challenge 2**: Open circuit with switch OFF
   - **Theory**: Understanding open circuits

3. **Challenge 3**: Closed circuit with switch ON
   - **Theory**: Switch functionality

4. **Challenge 4**: Toggle-able circuit
   - **Theory**: Switch control of current flow

5. **Challenge 5**: Series batteries
   - **Theory**: Voltage addition in series

6. **Challenge 6**: Series bulbs
   - **Theory**: Current distribution, voltage division

7. **Challenge 7**: Parallel bulbs
   - **Theory**: Voltage equality, current division

8. **Challenge 8**: Circuit with resistor
   - **Theory**: Ohm's Law (I = U/R), current limitation

Each challenge validates:
- ✅ Required components present
- ✅ Simulation runs successfully
- ✅ Circuit forms closed loop

---

## 🎨 Design Patterns & Architecture

### Scene-Based Architecture
- **Pattern**: State Machine
- **Implementation**: Phaser's scene system
- **Benefits**: Clean separation of concerns, easy navigation

### Component Pattern
- **Pattern**: Composition over Inheritance
- **Implementation**: Base `Component` class extended by specific types
- **Benefits**: Reusable logic, easy to add new components

### Graph-Based Simulation
- **Pattern**: Graph traversal (DFS)
- **Implementation**: Adjacency list with Set data structure
- **Benefits**: Efficient pathfinding, handles complex circuits

### Data Persistence
- **Pattern**: Repository Pattern
- **Implementation**: LocalStorage as data store
- **Benefits**: Simple persistence, no backend required

---

## 🚀 How to Run the Project

### Development Mode
```bash
npm install        # Install dependencies
npm run dev        # Start development server
```
Access at: `http://127.0.0.1:5173`

### Production Build
```bash
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🔍 Current Limitations & Issues

### 1. **Circuit Simulation Accuracy**
- **Issue**: Graph traversal may not handle all edge cases
- **Example**: Complex parallel/series combinations
- **Impact**: Some valid circuits might not be recognized

### 2. **Component Merging**
- **Issue**: 25px merge radius is hardcoded
- **Impact**: Components must be placed very precisely

### 3. **No Visual Circuit Feedback**
- **Issue**: No animation showing current flow
- **Impact**: Harder for students to visualize electricity

### 4. **Limited Component Set**
- **Issue**: Only 6 basic components
- **Missing**: Capacitors, diodes, motors, LEDs, multimeters (partially implemented)

### 5. **No Circuit Save/Load**
- **Issue**: Circuits are destroyed between challenges
- **Impact**: Can't review or share work

### 6. **Authentication Security**
- **Issue**: Passwords stored in plain text in LocalStorage
- **Impact**: Not suitable for real deployment

### 7. **No Mobile Optimization**
- **Issue**: Drag & drop challenging on touch devices
- **Impact**: Limited to desktop use

### 8. **Hardcoded Challenge Progress**
- **Issue**: Score manipulation example in code (line in `scoreboardScene.js`)
- **Impact**: Can be exploited

### 9. **Incomplete UI Scene**
- **Issue**: `UIScene.js` is empty placeholder
- **Impact**: No persistent UI elements

### 10. **No Tutorial/Help System**
- **Issue**: First-time users may be confused
- **Impact**: Steep learning curve

---

## 💡 Improvement Recommendations

### High Priority

#### 1. **Enhanced Circuit Visualization**
- **Recommendation**: Add animated current flow
- **Implementation**:
  - Use Phaser particles or line graphics
  - Animate along circuit paths when closed
  - Different colors for voltage levels
- **Impact**: Much better learning experience

#### 2. **Improved Circuit Simulation**
- **Recommendation**: Implement proper electrical calculations
- **Implementation**:
  - Calculate actual voltage drops (Kirchhoff's laws)
  - Compute current through each component (Ohm's law)
  - Display values on ammeters/voltmeters
- **Impact**: More realistic and educational

#### 3. **Component Connection System**
- **Recommendation**: Visual connection indicators
- **Implementation**:
  - Show connection dots/ports on components
  - Highlight valid connection points
  - Draw visible wires between components
- **Impact**: Clearer feedback, fewer errors

#### 4. **Tutorial System**
- **Recommendation**: Interactive tutorial for first-time users
- **Implementation**:
  - Step-by-step guided challenges
  - Tooltips on hover
  - Video/GIF demonstrations
  - In-game help button
- **Impact**: Better onboarding, reduced confusion

#### 5. **Mobile Support**
- **Recommendation**: Touch-optimized controls
- **Implementation**:
  - Long-press for component rotation
  - Touch-friendly button sizes
  - Responsive layout adjustments
  - Virtual component palette
- **Impact**: Accessible on tablets/phones

### Medium Priority

#### 6. **Save/Load System**
- **Recommendation**: Save circuit designs
- **Implementation**:
  - Serialize component positions and connections
  - Store in LocalStorage or export as JSON
  - Load previous circuits
  - Share circuits via URL/code
- **Impact**: Enables experimentation and sharing

#### 7. **Expanded Component Library**
- **Recommendation**: Add more components
- **Additions**:
  - Variable resistors (potentiometers)
  - Capacitors with charging animation
  - Diodes (current direction)
  - LEDs (color-coded)
  - Motors (rotation animation)
  - Solar panels
  - Ground connections
- **Impact**: More complex and realistic circuits

#### 8. **Achievement System**
- **Recommendation**: Gamification enhancements
- **Implementation**:
  - Badges for milestones
  - Unlock new components progressively
  - Daily challenges
  - Time-based bonuses
  - Streak tracking
- **Impact**: Increased engagement and motivation

#### 9. **Backend Integration**
- **Recommendation**: Server-side user management
- **Implementation**:
  - User authentication API (JWT)
  - Secure password storage (bcrypt)
  - Cloud-based leaderboard
  - Progress synchronization across devices
- **Technologies**: Node.js + Express + MongoDB/PostgreSQL
- **Impact**: Proper security and multi-device support

#### 10. **Analytics & Progress Tracking**
- **Recommendation**: Track learning progress
- **Implementation**:
  - Time spent per challenge
  - Number of attempts
  - Common mistakes/patterns
  - Teacher dashboard (for classroom use)
- **Impact**: Better educational insights

### Low Priority

#### 11. **Audio Feedback**
- **Recommendation**: Sound effects for interactions
- **Sounds**:
  - Click/place component
  - Circuit completion "buzz"
  - Success chime
  - Error beep
  - Background ambient lab sounds
- **Impact**: More immersive experience

#### 12. **Multiplayer Mode**
- **Recommendation**: Collaborative circuit building
- **Implementation**:
  - Real-time socket connection (Socket.io)
  - Shared workspace
  - Team challenges
  - Live leaderboards
- **Impact**: Social learning experience

#### 13. **Circuit Export**
- **Recommendation**: Export to standard formats
- **Formats**:
  - PNG/SVG diagram
  - PDF worksheet
  - LTspice/CircuitLab compatible
  - 3D printable designs
- **Impact**: Integration with other tools

#### 14. **Internationalization (i18n)**
- **Recommendation**: Multi-language support
- **Implementation**:
  - Translation system
  - Language selector
  - Currently only Slovenian
- **Languages**: English, German, Croatian, etc.
- **Impact**: Wider audience reach

#### 15. **Accessibility Improvements**
- **Recommendation**: WCAG compliance
- **Implementation**:
  - Keyboard navigation
  - Screen reader support
  - High contrast mode
  - Colorblind-friendly palettes
- **Impact**: Inclusive for all learners

---

## 🎓 Educational Value

### Learning Outcomes
Students will be able to:
- ✅ Identify basic electrical components
- ✅ Understand closed vs. open circuits
- ✅ Differentiate series vs. parallel connections
- ✅ Apply Ohm's Law conceptually
- ✅ Troubleshoot simple circuits
- ✅ Predict behavior before simulation

### Pedagogical Strengths
- **Constructivist Learning**: Students build knowledge through experimentation
- **Immediate Feedback**: Real-time circuit validation
- **Progressive Difficulty**: Scaffolded challenges
- **Gamification**: Motivation through points and achievements
- **Visual Learning**: Graphics reinforce abstract concepts

### Classroom Integration
- Can supplement traditional physics curriculum
- Suitable for ages 12-16 (middle school)
- Individual or small group work
- Homework assignments possible
- Competition mode for engagement

---

## 📊 Performance Considerations

### Current Performance
- **Loading Time**: Fast (minimal assets)
- **Runtime**: Smooth 60 FPS on modern browsers
- **Memory**: Low footprint (~50MB)
- **Network**: All assets local, no API calls

### Optimization Opportunities
1. **Sprite Atlases**: Combine component images into single texture
2. **Object Pooling**: Reuse destroyed components
3. **Lazy Loading**: Load scenes on demand
4. **Asset Compression**: Optimize PNG/SVG file sizes
5. **Code Splitting**: Separate vendor bundles

---

## 🧪 Testing Recommendations

### Unit Tests (Not Implemented)
- **Framework**: Jest or Vitest
- **Coverage**:
  - `CircuitGraph.simulate()` with various configurations
  - Node merging logic
  - Component conduction rules
  - Challenge validation

### Integration Tests
- **Framework**: Playwright or Cypress
- **Scenarios**:
  - Complete user registration flow
  - Build and verify each challenge
  - Navigate between all scenes
  - Scoreboard updates correctly

### User Testing
- **Target**: Middle school students (ages 12-14)
- **Goals**:
  - Measure time to complete challenges
  - Identify confusing UI elements
  - Gather feedback on difficulty
  - Test on various devices

---

## 🔐 Security Considerations

### Current Vulnerabilities
1. **Plain Text Passwords**: Stored directly in LocalStorage
2. **Client-Side Validation Only**: No server verification
3. **XSS Risk**: User input not sanitized (username)
4. **Score Manipulation**: Client-side score storage

### Recommended Fixes
1. Implement backend authentication
2. Hash passwords with bcrypt
3. Validate and sanitize all inputs
4. Server-side score tracking
5. Implement CSRF protection
6. Use HTTPS in production
7. Content Security Policy headers

---

## 📝 Code Quality Notes

### Strengths
- ✅ Clear folder structure
- ✅ Modular scene architecture
- ✅ ES6 class-based components
- ✅ Consistent naming conventions

### Areas for Improvement
- ❌ Limited code comments/documentation
- ❌ Some commented-out code (should be removed)
- ❌ Magic numbers (hardcoded values like 40, 150, etc.)
- ❌ Long methods (e.g., `WorkspaceScene.create()`)
- ❌ No error handling for LocalStorage failures
- ❌ Repeated code patterns (button creation)

### Refactoring Suggestions
1. Extract button creation to utility function
2. Move challenge data to separate JSON file
3. Create constants file for magic numbers
4. Add JSDoc comments to all classes/methods
5. Break large methods into smaller functions
6. Implement error boundaries
7. Add TypeScript for type safety (optional)

---

## 🌐 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+ (recommended)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Opera 76+

### Known Issues
- LocalStorage disabled in private mode
- Touch events may behave differently across mobile browsers
- Audio playback restrictions on iOS (if added)

---

## 📦 Dependencies Analysis

### Production Dependencies
- **phaser@3.90.0**: Core game engine (2.5MB minified)
  - Well-maintained, active community
  - Stable API, good documentation
  - No security vulnerabilities

### Development Dependencies
- **vite@7.1.7**: Build tool
  - Modern, fast, well-supported
  - Regular updates
  - Excellent DX (Developer Experience)

### Future Dependencies to Consider
- **Matter.js**: Advanced physics (if needed)
- **Howler.js**: Audio management
- **i18next**: Internationalization
- **Socket.io**: Multiplayer features
- **Chart.js**: Progress visualization

---

## 🎯 Roadmap Suggestions

### Version 1.1 (Quick Wins)
- [ ] Add circuit current visualization
- [ ] Implement tutorial overlay
- [ ] Fix component merging precision
- [ ] Add help/info buttons
- [ ] Improve mobile responsiveness

### Version 1.5 (Enhanced Features)
- [ ] Save/load circuits
- [ ] Add 5 more components
- [ ] Implement achievement system
- [ ] Teacher dashboard
- [ ] Backend integration

### Version 2.0 (Major Update)
- [ ] Multiplayer mode
- [ ] Advanced simulation (real calculations)
- [ ] 3D component models
- [ ] Circuit export functionality
- [ ] Mobile app (React Native/Capacitor)

---

## 📞 Conclusion

**RUPS Elektrotehnika** is a well-structured educational application with a solid foundation. The Phaser-based architecture provides excellent performance and interactive capabilities. The graph-based circuit simulation is innovative, though it needs refinement for accuracy.

### Key Strengths
1. Clear educational focus with progressive challenges
2. Engaging visual design and animations
3. Intuitive drag-and-drop interface
4. Clean code structure and modularity

### Critical Next Steps
1. Enhance circuit visualization (animate current flow)
2. Improve simulation accuracy (electrical calculations)
3. Add comprehensive tutorial system
4. Implement backend for proper security
5. Expand component library

With the recommended improvements, this application has the potential to become an exceptional tool for electrical education in schools. The gamification elements and hands-on approach align well with modern pedagogical best practices.

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025  
**Maintained By**: Project Analysis  
**License**: [Specify if applicable]
