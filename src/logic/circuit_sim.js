class CircuitSim {
    constructor() {
        this.source;
        this.tree = [];
        this.paths = [];
        this.activePaths = [];
        this.running_sim = false;
        this.nodeValues = [];
        this.equationList = [];
    }

    findSource() {
        this.source = window.components.find(c => c.type === 'battery' && !c.componentObject.getData('isInPanel'));
        return this.source;
    }

    generate_tree() {   
        this.findSource();
        this.tree = [];
        
        if (!this.source) {
            return;
        }
        
        // Validate battery wiring: must have wires on opposite poles
        if (!this.validateBatteryWiring()) {
            console.error('Battery wiring error: wires must be connected to opposite poles (start and end nodes)');
            return;
        }
        
        const allPaths = [];
        this.collectAllPaths(this.source, this.source.end, new Set(), [this.source.id], allPaths);
        
        if (allPaths.length > 0) {
            this.paths = allPaths;
        }
    }
    
    validateBatteryWiring() {
        if (!this.source) return false;
        
        const startHasWire = this.source.start.wire !== null && this.source.start.wire !== undefined;
        const endHasWire = this.source.end.wire !== null && this.source.end.wire !== undefined;
        
        // Check if both poles have wires
        if (!startHasWire || !endHasWire) {
            console.warn('Battery must have wires on both poles');
            return false;
        }
        
        // Check if wires are different (not the same wire)
        if (this.source.start.wire === this.source.end.wire) {
            console.warn('Battery poles cannot be connected by the same wire');
            return false;
        }
        
        return true;
    }
    
    collectAllPaths(currentComponent, currentNode, visited, path, allPaths) {
        visited.add(currentComponent.id);
        
        const nextNode = currentNode === currentComponent.start ? currentComponent.end : currentComponent.start;
        const adjacentComponents = this.getAdjacentComponents(nextNode, currentComponent);
        
        const batteryInAdjacent = adjacentComponents.find(comp => comp.id === this.source.id);
        
        if (batteryInAdjacent && currentComponent.id !== this.source.id) {
            const startingNode = this.source.start;
            const returningNode = nextNode;
            
            let batteryReturnNode = null;
            if (this.source.start.wire && returningNode.wire === this.source.start.wire) {
                batteryReturnNode = this.source.start;
            } else if (this.source.end.wire && returningNode.wire === this.source.end.wire) {
                batteryReturnNode = this.source.end;
            }
            
            if (batteryReturnNode !== startingNode) {
                allPaths.push([...path, this.source.id]);
            }
            
            visited.delete(currentComponent.id);
            return;
        }
        
        const unvisitedComponents = adjacentComponents.filter(comp => !visited.has(comp.id));
        
        for (const nextComponent of unvisitedComponents) {
            let nextComponentNode;
            if (nextNode.wire && nextComponent.start.wire === nextNode.wire) {
                nextComponentNode = nextComponent.start;
            } else if (nextNode.wire && nextComponent.end.wire === nextNode.wire) {
                nextComponentNode = nextComponent.end;
            } else {
                nextComponentNode = (nextComponent.start === nextNode || 
                    (nextComponent.start.x === nextNode.x && nextComponent.start.y === nextNode.y)) 
                                    ? nextComponent.start : nextComponent.end;
            }
            
            path.push(nextComponent.id);
            this.collectAllPaths(nextComponent, nextComponentNode, visited, path, allPaths);
            path.pop();
        }
        
        visited.delete(currentComponent.id);
    }
    
    getAdjacentComponents(node, excludeComponent) {
        if (!node.wire) {
            return [];
        }
        
        const adjacentComponents = [];
        
        for (const wireNode of node.wire.nodes) {
            if (wireNode.component) {
                if (wireNode.component.id !== excludeComponent.id) {
                    if (wireNode === wireNode.component.start || wireNode === wireNode.component.end) {
                        if (!adjacentComponents.find(c => c.id === wireNode.component.id)) {
                            adjacentComponents.push(wireNode.component);
                        }
                    }
                }
            }
        }
        
        return adjacentComponents;
    }

    init() {
        this.generate_tree();
        this.run_tick();
    }

    pickActivePaths() {
        this.activePaths = [];
        
        for (const path of this.paths) {
            let isActive = true;
            
            // Skip first (battery) - check only middle components
            for (let i = 1; i < path.length - 1; i++) {
                const componentId = path[i];
                const component = window.components.find(c => c.id === componentId);
                
                if (!component) {
                    isActive = false;
                    break;
                }
                
                // Check if there's an open switch in the path
                if (component.type === 'switch' && !component.is_on) {
                    isActive = false;
                    break;
                }
                
                const directionalTypes = ['battery', 'ampermeter', 'voltmeter', 'diode', 'led', 'bulb'];
                if (directionalTypes.includes(component.type)) {
                    const prevComponentId = path[i - 1];
                    const prevComponent = window.components.find(c => c.id === prevComponentId);
                    if (!directionalTypes.includes(prevComponent.type)) {break;}
                    // Check which node is shared between previous component and current component
                    let enteredFromStart = false;
                    if (prevComponent.type === 'battery') {
                        if (prevComponent.start.wire && component.start.wire === prevComponent.start.wire) {
                            enteredFromStart = true;
                        }
                    }
                    
                    // If we entered from end node, current flows backwards - component blocks
                    if (!enteredFromStart) {
                        isActive = false;
                        break;
                    }
                }
            }
            
            if (isActive) {
                this.activePaths.push(path);
            }
        }
        
        return this.activePaths;
    }

    run_sim() {
        while (this.running_sim) {
            this.run_tick();
        }
    }

    run_tick() {
        this.pickActivePaths();
        this.createTreeFromPaths();
        console.log(this.getTreeString());
        this.extractValues();
        console.log(this.getValuesSummary());
        this.poolEquations();
        this.solvePool();
        this.updateComponents();
        console.log(this.getValuesSummary());
    }

    // Extract values from all components in the tree
    extractValues(tree = this.tree) {
        const values = [];
        
        // Check if tree is empty or undefined
        if (!tree || (Array.isArray(tree) && tree.length === 0)) {
            return values;
        }
        
        const extractFromItem = (item) => {
            if (Array.isArray(item)) {
                // Recursively extract from array items
                item.forEach(subItem => extractFromItem(subItem));
            } else if (typeof item === 'string') {
                // It's a component ID
                const component = window.components.find(c => c.id === item);
                if (component && component.values && component.type != "battery") {
                    const componentValues = {
                        id: component.id,
                        name: component.values.name,
                        type: component.type,
                        resistance: this.extractValue(component.values.resistance),
                        voltage: this.extractValue(component.values.voltageDrop || component.values.voltage),
                        current: this.extractValue(component.values.current),
                        power: this.extractValue(component.values.power)
                    };
                    values.push(componentValues);
                } else if (component && component.type == "battery") {
                   const componentValues = {
                        id: component.id,
                        name: component.values.name,
                        type: component.type,
                        voltage: this.extractValue(component.values.voltageDrop || component.values.voltage),
                        current: this.extractValue(component.values.current),
                        power: this.extractValue(component.values.power)
                    }; 
                    values.push(componentValues);
                }
            }
        };
        
        extractFromItem(tree);
        this.nodeValues = values;
        return values;
    }

    // Helper to extract value from both direct values and value objects
    extractValue(value) {
        if (value === undefined || value.automatic) {
            return undefined;
        }
        if (typeof value === 'object' && 'value' in value) {
            return value.value;
        }
        return value;
    }

    // List all undefined variables (resistance, voltage, current) in the tree
    listUndefinedVariables(tree = this.tree) {
        const values = this.extractValues(tree);
        const undefined_vars = [];

        values.forEach(comp => {
            
            if (comp.resistance === undefined) {
                undefined_vars.push(comp.id + "."+'resistance');
            }
            if (comp.voltage === undefined) {
                undefined_vars.push(comp.id + "."+'voltage');
            }
            if (comp.current === undefined) {
                undefined_vars.push(comp.id + "."+'current');
            }
            if (comp.power === undefined) {
                undefined_vars.push(comp.id + "."+'power');
            }
        });

        return undefined_vars;
    }

    getValuesSummary() {
        const values = this.nodeValues;
        
        if (!values || values.length === 0) {
            return '(no components)';
        }
        
        return values.map(v => {
            const r = v.resistance !== undefined ? `${v.resistance}Ω` : 'undefined';
            const volt = v.voltage !== undefined ? `${v.voltage}V` : 'undefined';
            const i = v.current !== undefined ? `${v.current}A` : 'undefined';
            const p = v.power !== undefined ? `${v.power}W` : 'undefined';
            return `${v.name} (${v.type}): R=${r}, V=${volt}, I=${i}, P=${p}`;
        }).join('\n');
    }

    getTreeString(tree = this.tree) {
        if (!tree) return '(empty)';
        
        if (Array.isArray(tree)) {
            const items = tree.map(item => {
                if (Array.isArray(item)) {
                    return `[${this.getTreeString(item)}]`;
                } else {
                    const component = window.components.find(c => c.id === item);
                    const type = component ? component.values.name : '???';
                    return `${type}`;
                }
            });
            return items.join(', ');
        } else {
            const component = window.components.find(c => c.id === tree);
            const type = component ? component.values.name : '???';
            return type;
        }
    }

    createTreeFromPaths() {
        if (this.activePaths.length === 0) {
            return [];
        }
        
        if (this.activePaths.length === 1) {
            this.tree = this.activePaths[0];
            return this.tree;
        }
        
        // Find the common prefix and suffix of all paths
        const paths = this.activePaths;
        
        // Find common prefix
        let prefixLength = 0;
        while (prefixLength < paths[0].length) {
            const componentId = paths[0][prefixLength];
            if (paths.every(path => path[prefixLength] === componentId)) {
                prefixLength++;
            } else {
                break;
            }
        }
        
        // Find common suffix
        let suffixLength = 0;
        while (suffixLength < paths[0].length - prefixLength) {
            const componentId = paths[0][paths[0].length - 1 - suffixLength];
            if (paths.every(path => path[path.length - 1 - suffixLength] === componentId)) {
                suffixLength++;
            } else {
                break;
            }
        }
        
        // Extract common prefix
        const prefix = paths[0].slice(0, prefixLength);
        
        // Extract common suffix
        const suffix = paths[0].slice(paths[0].length - suffixLength);
        
        // Extract middle parts (the parallel sections)
        const middles = paths.map(path => 
            path.slice(prefixLength, path.length - suffixLength)
        );
        
        // Recursively process middle sections if they have further branches
        const processedMiddles = this.mergeSimilarPaths(middles);
        
        // Build the final tree
        this.tree = [...prefix, processedMiddles, ...suffix];
        
        return this.tree;
    }
    
    mergeSimilarPaths(paths) {
        if (paths.length === 1) {
            return paths[0];
        }
        
        // Check if all paths are single components (no further branching)
        if (paths.every(path => path.length === 1)) {
            return paths.map(path => path[0]);
        }
        
        // Find common prefix in these paths
        let prefixLength = 0;
        while (prefixLength < paths[0].length) {
            const componentId = paths[0][prefixLength];
            if (paths.every(path => path[prefixLength] === componentId)) {
                prefixLength++;
            } else {
                break;
            }
        }
        
        // Find common suffix
        let suffixLength = 0;
        while (suffixLength < paths[0].length - prefixLength) {
            const componentId = paths[0][paths[0].length - 1 - suffixLength];
            if (paths.every(path => path[path.length - 1 - suffixLength] === componentId)) {
                suffixLength++;
            } else {
                break;
            }
        }
        
        if (prefixLength === 0 && suffixLength === 0) {
            // No common parts, these are truly parallel
            return paths.map(path => path.length === 1 ? path[0] : path);
        }
        
        // Extract parts
        const prefix = paths[0].slice(0, prefixLength);
        const suffix = paths[0].slice(paths[0].length - suffixLength);
        const middles = paths.map(path => 
            path.slice(prefixLength, path.length - suffixLength)
        );
        
        // Recursively process middles
        const processedMiddles = this.mergeSimilarPaths(middles);
        
        return [...prefix, processedMiddles, ...suffix];
    }

    poolEquations() {
        this.equationList = [];
        const undefinedVars = this.listUndefinedVariables();
        console.log('Undefined variables:', undefinedVars);
        
        // Generate equations for each component based on Ohm's law and power equations
        this.nodeValues.forEach(comp => {
            const prefix = `${comp.id}`;
            
            // For non-battery components, generate Ohm's law equations
            if (comp.type !== 'battery') {
                // V = I * R
                this.equationList.push({
                    type: 'ohms_law_v',
                    equation: `${prefix}.voltage = ${prefix}.current * ${prefix}.resistance`,
                    solve: (values) => {
                        if (values.current !== undefined && values.resistance !== undefined) {
                            return { voltage: values.current * values.resistance };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['current', 'resistance'],
                    solves: 'voltage'
                });
                
                // I = V / R
                this.equationList.push({
                    type: 'ohms_law_i',
                    equation: `${prefix}.current = ${prefix}.voltage / ${prefix}.resistance`,
                    solve: (values) => {
                        if (values.voltage !== undefined && values.resistance !== undefined && values.resistance !== 0) {
                            return { current: values.voltage / values.resistance };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['voltage', 'resistance'],
                    solves: 'current'
                });
                
                // R = V / I
                this.equationList.push({
                    type: 'ohms_law_r',
                    equation: `${prefix}.resistance = ${prefix}.voltage / ${prefix}.current`,
                    solve: (values) => {
                        if (values.voltage !== undefined && values.current !== undefined && values.current !== 0) {
                            return { resistance: values.voltage / values.current };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['voltage', 'current'],
                    solves: 'resistance'
                });
            }
            
            // P = V * I (for all components)
            this.equationList.push({
                type: 'power_vi',
                equation: `${prefix}.power = ${prefix}.voltage * ${prefix}.current`,
                solve: (values) => {
                    if (values.voltage !== undefined && values.current !== undefined) {
                        return { power: values.voltage * values.current };
                    }
                    return null;
                },
                component: comp.id,
                requires: ['voltage', 'current'],
                solves: 'power'
            });
            
            // I = P / V
            this.equationList.push({
                type: 'power_i',
                equation: `${prefix}.current = ${prefix}.power / ${prefix}.voltage`,
                solve: (values) => {
                    if (values.power !== undefined && values.voltage !== undefined && values.voltage !== 0) {
                        return { current: values.power / values.voltage };
                    }
                    return null;
                },
                component: comp.id,
                requires: ['power', 'voltage'],
                solves: 'current'
            });
            
            // V = P / I
            this.equationList.push({
                type: 'power_v',
                equation: `${prefix}.voltage = ${prefix}.power / ${prefix}.current`,
                solve: (values) => {
                    if (values.power !== undefined && values.current !== undefined && values.current !== 0) {
                        return { voltage: values.power / values.current };
                    }
                    return null;
                },
                component: comp.id,
                requires: ['power', 'current'],
                solves: 'voltage'
            });
        });
        
        // Generate Kirchhoff equations for series and parallel circuits
        this.generateKirchhoffEquations(this.tree);
        
        console.log(`Generated ${this.equationList.length} equations`);
        return this.equationList;
    }
    
    generateKirchhoffEquations(tree, parentType = 'series') {
        if (!tree || tree.length === 0) return;
        
        const processLevel = (items, connectionType) => {
            const componentIds = [];
            
            items.forEach(item => {
                if (Array.isArray(item)) {
                    // Nested array = parallel connection
                    this.generateKirchhoffEquations(item, 'parallel');
                } else if (typeof item === 'string') {
                    const comp = this.nodeValues.find(c => c.id === item);
                    if (comp && comp.type !== 'battery') {
                        componentIds.push(item);
                    }
                }
            });
            
            if (componentIds.length > 1) {
                if (connectionType === 'series') {
                    // Kirchhoff's current law: same current through all series components
                    this.equationList.push({
                        type: 'kcl_series',
                        equation: `${componentIds.map(id => `${id}.current`).join(' = ')}`,
                        components: componentIds,
                        connectionType: 'series'
                    });
                    
                    // Kirchhoff's voltage law: sum of voltages in series
                    this.equationList.push({
                        type: 'kvl_series',
                        equation: `V_total = ${componentIds.map(id => `${id}.voltage`).join(' + ')}`,
                        components: componentIds,
                        connectionType: 'series'
                    });
                } else if (connectionType === 'parallel') {
                    // Kirchhoff's voltage law: same voltage across parallel components
                    this.equationList.push({
                        type: 'kvl_parallel',
                        equation: `${componentIds.map(id => `${id}.voltage`).join(' = ')}`,
                        components: componentIds,
                        connectionType: 'parallel'
                    });
                    
                    // Kirchhoff's current law: sum of currents in parallel
                    this.equationList.push({
                        type: 'kcl_parallel',
                        equation: `I_total = ${componentIds.map(id => `${id}.current`).join(' + ')}`,
                        components: componentIds,
                        connectionType: 'parallel'
                    });
                }
            }
        };
        
        processLevel(Array.isArray(tree) ? tree : [tree], parentType);
    }

    solvePool() {
        let changesMade = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops
        
        // Track defined variables
        const definedVariables = new Set();
        
        // Initialize with known values
        this.nodeValues.forEach(comp => {
            if (comp.resistance !== undefined) {
                definedVariables.add(`${comp.id}.resistance`);
            }
            if (comp.voltage !== undefined) {
                definedVariables.add(`${comp.id}.voltage`);
            }
            if (comp.current !== undefined) {
                definedVariables.add(`${comp.id}.current`);
            }
            if (comp.power !== undefined) {
                definedVariables.add(`${comp.id}.power`);
            }
        });
        
        console.log('Starting equation solver...');
        console.log('Initially defined variables:', Array.from(definedVariables));
        
        while (changesMade && iterations < maxIterations) {
            changesMade = false;
            iterations++;
            
            console.log(`\n--- Iteration ${iterations} ---`);
            
            // Try to solve each equation
            for (const eq of this.equationList) {
                if (!eq.solve || !eq.component) continue;
                
                // Get the component's current values
                const comp = this.nodeValues.find(c => c.id === eq.component);
                if (!comp) continue;
                
                // Check if we already have the value this equation solves for
                const varName = `${comp.id}.${eq.solves}`;
                if (definedVariables.has(varName)) continue;
                
                // Try to solve the equation
                const result = eq.solve(comp);
                
                if (result) {
                    // Update the component with the solved value
                    Object.assign(comp, result);
                    
                    // Mark variable as defined
                    definedVariables.add(varName);
                    
                    console.log(`✓ Solved ${eq.type} for ${comp.name}: ${eq.solves} = ${result[eq.solves]}`);
                    console.log(`  Defined: ${varName}`);
                    changesMade = true;
                }
            }
            
            // Apply Kirchhoff's laws and track new definitions
            const kirchhoffChanges = this.applyKirchhoffLaws(definedVariables);
            changesMade = kirchhoffChanges || changesMade;
        }
        
        console.log(`\nSolver completed in ${iterations} iterations`);
        console.log('All defined variables:', Array.from(definedVariables).sort());
        
        // List remaining undefined variables
        const stillUndefined = this.listUndefinedVariables();
        if (stillUndefined.length > 0) {
            console.warn('Still undefined:', stillUndefined);
        } else {
            console.log('✓ All variables solved!');
        }
        
        // Cross-validate results
        this.crossValidate();
        
        return this.nodeValues;
    }
    
    applyKirchhoffLaws(definedVariables) {
        let changesMade = false;
        
        for (const eq of this.equationList) {
            if (!eq.components || !eq.connectionType) continue;
            
            const components = eq.components.map(id => 
                this.nodeValues.find(c => c.id === id)
            ).filter(c => c !== undefined);
            
            if (components.length < 2) continue;
            
            if (eq.type === 'kcl_series') {
                // Same current through all series components
                // Find first defined current
                const definedCurrent = components.find(c => c.current !== undefined);
                if (definedCurrent) {
                    components.forEach(comp => {
                        const varName = `${comp.id}.current`;
                        if (!definedVariables.has(varName)) {
                            comp.current = definedCurrent.current;
                            definedVariables.add(varName);
                            console.log(`✓ KCL Series: ${comp.name}.current = ${definedCurrent.current}A`);
                            console.log(`  Defined: ${varName}`);
                            changesMade = true;
                        }
                    });
                }
            }
            
            if (eq.type === 'kvl_parallel') {
                // Same voltage across all parallel components
                // Find first defined voltage
                const definedVoltage = components.find(c => c.voltage !== undefined);
                if (definedVoltage) {
                    components.forEach(comp => {
                        const varName = `${comp.id}.voltage`;
                        if (!definedVariables.has(varName)) {
                            comp.voltage = definedVoltage.voltage;
                            definedVariables.add(varName);
                            console.log(`✓ KVL Parallel: ${comp.name}.voltage = ${definedVoltage.voltage}V`);
                            console.log(`  Defined: ${varName}`);
                            changesMade = true;
                        }
                    });
                } else {
                    // No voltage defined yet, but we can calculate from battery and series components
                    const battery = this.nodeValues.find(c => c.type === 'battery');
                    if (battery && battery.voltage !== undefined) {
                        // Find all components in series (not in this parallel group)
                        const seriesComponents = this.nodeValues.filter(c => 
                            c.type !== 'battery' && 
                            !components.some(pc => pc.id === c.id) &&
                            c.voltage !== undefined
                        );
                        
                        if (seriesComponents.length > 0) {
                            const sumSeries = seriesComponents.reduce((sum, c) => sum + c.voltage, 0);
                            const parallelVoltage = battery.voltage - sumSeries;
                            
                            if (parallelVoltage > 0) {
                                components.forEach(comp => {
                                    const varName = `${comp.id}.voltage`;
                                    if (!definedVariables.has(varName)) {
                                        comp.voltage = parallelVoltage;
                                        definedVariables.add(varName);
                                        console.log(`✓ KVL Parallel (calculated): ${comp.name}.voltage = ${parallelVoltage}V (${battery.voltage}V - ${sumSeries}V from series)`);
                                        console.log(`  Defined: ${varName}`);
                                        changesMade = true;
                                    }
                                });
                            }
                        }
                    }
                }
            }
            
            if (eq.type === 'kvl_series') {
                // Sum of voltages in series equals total voltage: V_battery = V1 + V2 + V3 + ...
                const battery = this.nodeValues.find(c => c.type === 'battery');
                if (battery && battery.voltage !== undefined) {
                    const knownVoltages = components.filter(c => c.voltage !== undefined);
                    const unknownVoltages = components.filter(c => c.voltage === undefined);
                    
                    // If only one unknown, calculate it directly
                    if (unknownVoltages.length === 1 && knownVoltages.length > 0) {
                        const sumKnown = knownVoltages.reduce((sum, c) => sum + c.voltage, 0);
                        const remaining = battery.voltage - sumKnown;
                        const varName = `${unknownVoltages[0].id}.voltage`;
                        unknownVoltages[0].voltage = remaining;
                        definedVariables.add(varName);
                        console.log(`✓ KVL Series: ${unknownVoltages[0].name}.voltage = ${remaining}V (${battery.voltage}V - ${sumKnown}V)`);
                        console.log(`  Defined: ${varName}`);
                        changesMade = true;
                    }
                    // If multiple unknowns but they're in parallel with each other, they have equal voltages
                    else if (unknownVoltages.length > 1) {
                        // Check if unknown components are parallel to each other
                        const parallelEqs = this.equationList.filter(e => 
                            e.type === 'kvl_parallel' && 
                            e.components && 
                            unknownVoltages.some(u => e.components.includes(u.id))
                        );
                        
                        for (const parallelEq of parallelEqs) {
                            const parallelUnknowns = unknownVoltages.filter(u => 
                                parallelEq.components.includes(u.id)
                            );
                            
                            if (parallelUnknowns.length > 1) {
                                // These components are in parallel, so they share voltage
                                const sumKnown = knownVoltages.reduce((sum, c) => sum + c.voltage, 0);
                                // Total remaining voltage divided by number of parallel branches
                                const remaining = (battery.voltage - sumKnown) / parallelUnknowns.length;
                                
                                parallelUnknowns.forEach(comp => {
                                    const varName = `${comp.id}.voltage`;
                                    if (!definedVariables.has(varName)) {
                                        comp.voltage = remaining;
                                        definedVariables.add(varName);
                                        console.log(`✓ KVL Series+Parallel: ${comp.name}.voltage = ${remaining}V (equal parallel voltages)`);
                                        console.log(`  Defined: ${varName}`);
                                        changesMade = true;
                                    }
                                });
                            }
                        }
                    }
                }
            }
            
            if (eq.type === 'kcl_parallel') {
                // Sum of currents in parallel equals total current
                const battery = this.nodeValues.find(c => c.type === 'battery');
                if (battery && battery.current !== undefined) {
                    const knownCurrents = components.filter(c => c.current !== undefined);
                    const unknownCurrents = components.filter(c => c.current === undefined);
                    
                    if (unknownCurrents.length === 1 && knownCurrents.length > 0) {
                        const sumKnown = knownCurrents.reduce((sum, c) => sum + c.current, 0);
                        const remaining = battery.current - sumKnown;
                        const varName = `${unknownCurrents[0].id}.current`;
                        unknownCurrents[0].current = remaining;
                        definedVariables.add(varName);
                        console.log(`✓ KCL Parallel: ${unknownCurrents[0].name}.current = ${remaining}A`);
                        console.log(`  Defined: ${varName}`);
                        changesMade = true;
                    }
                }
            }
        }
        
        return changesMade;
    }
    
    crossValidate() {
        console.log('\n=== Cross-validation ===');
        let hasErrors = false;
        
        this.nodeValues.forEach(comp => {
            if (comp.type === 'battery') return;
            
            // Validate Ohm's law: V = I * R
            if (comp.voltage !== undefined && comp.current !== undefined && comp.resistance !== undefined) {
                const calculatedV = comp.current * comp.resistance;
                const error = Math.abs(comp.voltage - calculatedV);
                const tolerance = 0.001; // Allow small floating point errors
                
                if (error > tolerance) {
                    console.warn(`⚠ ${comp.name}: Ohm's law mismatch! V=${comp.voltage}V but I*R=${calculatedV}V (error: ${error}V)`);
                    hasErrors = true;
                } else {
                    console.log(`✓ ${comp.name}: Ohm's law validated`);
                }
            }
            
            // Validate Power: P = V * I
            if (comp.power !== undefined && comp.voltage !== undefined && comp.current !== undefined) {
                const calculatedP = comp.voltage * comp.current;
                const error = Math.abs(comp.power - calculatedP);
                const tolerance = 0.001;
                
                if (error > tolerance) {
                    console.warn(`⚠ ${comp.name}: Power mismatch! P=${comp.power}W but V*I=${calculatedP}W (error: ${error}W)`);
                    hasErrors = true;
                } else {
                    console.log(`✓ ${comp.name}: Power equation validated`);
                }
            }
        });
        
        if (!hasErrors) {
            console.log('✓ All values validated successfully!');
        }
    }

    updateComponents() {
        console.log('\n=== Updating component values ===');
        let updateCount = 0;
        
        // Update each component with solved values
        this.nodeValues.forEach(nodeValue => {
            const component = window.components.find(c => c.id === nodeValue.id);
            
            if (!component || !component.values) {
                console.warn(`Component ${nodeValue.id} not found`);
                return;
            }
            
            // Update resistance
            if (nodeValue.resistance !== undefined && component.type !== 'battery') {
                if (typeof component.values.resistance === 'object') {
                    component.values.resistance.value = nodeValue.resistance;
                } else {
                    component.values.resistance = nodeValue.resistance;
                }
                updateCount++;
            }
            
            // Update voltage (voltageDrop for most components, voltage for battery)
            if (nodeValue.voltage !== undefined) {
                if (component.type === 'battery') {
                    if (typeof component.values.voltage === 'object') {
                        component.values.voltage.value = nodeValue.voltage;
                    } else {
                        component.values.voltage = nodeValue.voltage;
                    }
                } else {
                    if (typeof component.values.voltageDrop === 'object') {
                        component.values.voltageDrop.value = nodeValue.voltage;
                    } else {
                        component.values.voltageDrop = nodeValue.voltage;
                    }
                }
                updateCount++;
            }
            
            // Update current
            if (nodeValue.current !== undefined) {
                if (typeof component.values.current === 'object') {
                    component.values.current.value = nodeValue.current;
                } else {
                    component.values.current = nodeValue.current;
                }
                updateCount++;
            }
            
            // Update power
            if (nodeValue.power !== undefined) {
                if (typeof component.values.power === 'object') {
                    component.values.power.value = nodeValue.power;
                } else {
                    component.values.power = nodeValue.power;
                }
                updateCount++;
            }
            
            console.log(`✓ Updated ${component.values.name}:`, {
                R: nodeValue.resistance ? `${nodeValue.resistance}Ω` : '-',
                V: nodeValue.voltage ? `${nodeValue.voltage}V` : '-',
                I: nodeValue.current ? `${nodeValue.current}A` : '-',
                P: nodeValue.power ? `${nodeValue.power}W` : '-'
            });
        });
        
        console.log(`\n✓ Updated ${updateCount} values across ${this.nodeValues.length} components`);
    }
}

export { CircuitSim };