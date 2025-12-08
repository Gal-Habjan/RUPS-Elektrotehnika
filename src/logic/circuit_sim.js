class CircuitSim {
    constructor() {
        this.source;
        this.tree = [];
        this.paths = [];
        this.activePaths = [];
        this.running_sim = false;
        this.nodeValues = [];
        this.equationList = [];
        this.negativeVoltage = false;
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
            // Check for negative voltage and reverse paths if needed
            this.checkNegativeVoltage();
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
                        if (!this.negativeVoltage && prevComponent.start.wire && component.start.wire === prevComponent.start.wire) {
                            enteredFromStart = true;
                        } else if (this.negativeVoltage && prevComponent.end.wire && component.start.wire === prevComponent.end.wire) {
                            enteredFromStart = true;
                        }
                    } else if ((prevComponent.start.wire && component.start.wire === prevComponent.start.wire) || (prevComponent.end.wire && component.start.wire === prevComponent.end.wire)) {    
                        enteredFromStart = true;
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

    checkNegativeVoltage() {
        if (!this.source || !this.source.values || this.source.values.voltage === undefined) {
            this.negativeVoltage = false;
            return false;
        }
        
        const batteryVoltage = typeof this.source.values.voltage === 'object' 
            ? this.source.values.voltage.value 
            : this.source.values.voltage;
        
        if (batteryVoltage < 0) {
            this.negativeVoltage = true;
            console.log('⚠ Battery voltage is negative, paths will be reversed');
            // Reverse all paths
            this.paths = this.paths.map(path => [...path].reverse());
            return true;
        }
        
        this.negativeVoltage = false;
        return false;
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
                        voltage: Math.abs(this.extractValue(component.values.voltageDrop || component.values.voltage)),
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
        if (value === undefined) {
            return undefined;
        }
        if (typeof value === 'object' && 'value' in value) {
            // If it's a value object with automatic flag, check if it's automatic
            if (value.automatic === true) {
                return undefined; // Treat automatic values as undefined (need to be calculated)
            }
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
        
        // Generate parallel current sum equations based on active paths
        this.generateParallelCurrentSumEquations();
        
        console.log(`Generated ${this.equationList.length} equations`);
        return this.equationList;
    }
    
    generateKirchhoffEquations(tree, parentType = 'series') {
        if (!tree || tree.length === 0) return;
        
        const processLevel = (items, connectionType) => {
            const componentIds = [];
            const nestedGroups = [];
            
            items.forEach(item => {
                if (Array.isArray(item)) {
                    // Nested array = opposite connection type (series->parallel or parallel->series)
                    const nestedType = connectionType === 'series' ? 'parallel' : 'series';
                    this.generateKirchhoffEquations(item, nestedType);
                    // Track nested groups for current/voltage propagation
                    nestedGroups.push(item);
                } else if (typeof item === 'string') {
                    const comp = this.nodeValues.find(c => c.id === item);
                    if (comp && comp.type !== 'battery') {
                        componentIds.push(item);
                    }
                }
            });
            
            if (connectionType === 'series') {
                // For series connection, all components (including those in nested groups) share the same current
                const allSeriesComponents = [...componentIds];
                
                if (allSeriesComponents.length > 1) {
                    // Kirchhoff's current law: same current through all series components
                    // Generate solve equations for each component
                    allSeriesComponents.forEach((targetId, index) => {
                        const otherIds = allSeriesComponents.filter((id, i) => i !== index);
                        
                        this.equationList.push({
                            type: 'kcl_series',
                            equation: `${targetId}.current = ${otherIds[0]}.current`,
                            solve: (values) => {
                                // Find any other component with defined current
                                for (const otherId of otherIds) {
                                    const otherComp = this.nodeValues.find(c => c.id === otherId);
                                    if (otherComp && otherComp.current !== undefined) {
                                        return { current: otherComp.current };
                                    }
                                }
                                return null;
                            },
                            component: targetId,
                            requires: otherIds.map(id => `${id}.current`),
                            solves: 'current',
                            connectionType: 'series',
                            relatedComponents: otherIds
                        });
                    });
                }
            }
            
            // Multi-level KCL for parallel branches
            if (connectionType === 'parallel' && componentIds.length > 0) {
                // Collect representatives from all parallel branches
                const branchRepresentatives = [...componentIds];
                
                if (branchRepresentatives.length > 1) {
                    // KCL: Sum of branch currents equals total current
                    // I_total = I_branch1 + I_branch2 + ...
                    // Generate solve equations for each branch
                    branchRepresentatives.forEach((targetId, index) => {
                        const otherIds = branchRepresentatives.filter((id, i) => i !== index);
                        
                        this.equationList.push({
                            type: 'kcl_parallel',
                            equation: `${targetId}.current = I_battery - ${otherIds.map(id => `${id}.current`).join(' - ')}`,
                            solve: (values) => {
                                // Need battery current and all other branch currents
                                const battery = this.nodeValues.find(c => c.type === 'battery');
                                if (!battery || battery.current === undefined) return null;
                                
                                let sumOthers = 0;
                                for (const otherId of otherIds) {
                                    const otherComp = this.nodeValues.find(c => c.id === otherId);
                                    if (!otherComp || otherComp.current === undefined) return null;
                                    sumOthers += otherComp.current;
                                }
                                
                                return { current: battery.current - sumOthers };
                            },
                            component: targetId,
                            requires: ['battery.current', ...otherIds.map(id => `${id}.current`)],
                            solves: 'current',
                            connectionType: 'parallel',
                            isBranchLevel: true,
                            relatedComponents: otherIds
                        });
                    });
                }
            }
            
            // KVL equations
            if (connectionType === 'parallel' && componentIds.length > 1) {
                // Kirchhoff's voltage law: same voltage across parallel components
                // Generate solve equations for each component
                componentIds.forEach((targetId, index) => {
                    const otherIds = componentIds.filter((id, i) => i !== index);
                    
                    this.equationList.push({
                        type: 'kvl_parallel',
                        equation: `${targetId}.voltage = ${otherIds[0]}.voltage`,
                        solve: (values) => {
                            // Find any other component with defined voltage
                            for (const otherId of otherIds) {
                                const otherComp = this.nodeValues.find(c => c.id === otherId);
                                if (otherComp && otherComp.voltage !== undefined) {
                                    return { voltage: otherComp.voltage };
                                }
                            }
                            return null;
                        },
                        component: targetId,
                        requires: otherIds.map(id => `${id}.voltage`),
                        solves: 'voltage',
                        connectionType: 'parallel',
                        relatedComponents: otherIds
                    });
                });
            }
        };
        
        processLevel(Array.isArray(tree) ? tree : [tree], parentType);
    }
    
    // Helper to flatten nested arrays and extract component IDs
    flattenComponentIds(item) {
        const ids = [];
        
        if (Array.isArray(item)) {
            item.forEach(subItem => {
                ids.push(...this.flattenComponentIds(subItem));
            });
        } else if (typeof item === 'string') {
            const comp = this.nodeValues.find(c => c.id === item);
            if (comp && comp.type !== 'battery') {
                ids.push(item);
            }
        }
        
        return ids;
    }

    // Generate equations that sum parallel branch currents and assign to next component
    generateParallelCurrentSumEquations() {
        if (this.activePaths.length < 2) return; // No parallel paths
        
        // Find where paths diverge (start of parallel section)
        let divergeIndex = 0;
        for (let i = 0; i < Math.min(...this.activePaths.map(p => p.length)); i++) {
            const firstPathComp = this.activePaths[0][i];
            if (this.activePaths.every(path => path[i] === firstPathComp)) {
                divergeIndex = i + 1;
            } else {
                break;
            }
        }
        
        // Find where paths converge (end of parallel section)
        let convergeIndex = this.activePaths[0].length;
        for (let i = 1; i <= Math.min(...this.activePaths.map(p => p.length)); i++) {
            const firstPathComp = this.activePaths[0][this.activePaths[0].length - i];
            if (this.activePaths.every(path => path[path.length - i] === firstPathComp)) {
                convergeIndex = this.activePaths[0].length - i;
            } else {
                break;
            }
        }
        
        // Check if there's actually a parallel section
        if (divergeIndex >= convergeIndex) return;
        
        // Get the component right after the parallel section (where currents merge)
        const componentAfterParallel = this.activePaths[0][convergeIndex];
        if (!componentAfterParallel) return;
        
        const afterComp = this.nodeValues.find(c => c.id === componentAfterParallel);
        if (!afterComp || afterComp.type === 'battery') return;
        
        // Collect first component from each parallel branch
        const branchComponents = [];
        for (const path of this.activePaths) {
            if (divergeIndex < path.length) {
                const branchCompId = path[divergeIndex];
                const branchComp = this.nodeValues.find(c => c.id === branchCompId);
                if (branchComp && branchComp.type !== 'battery') {
                    branchComponents.push(branchCompId);
                }
            }
        }
        
        if (branchComponents.length < 2) return;
        
        // Generate equation: current after parallel = sum of all branch currents
        this.equationList.push({
            type: 'kcl_parallel_sum',
            equation: `${componentAfterParallel}.current = ${branchComponents.map(id => `${id}.current`).join(' + ')}`,
            solve: (values) => {
                // Sum all branch currents
                let totalCurrent = 0;
                let hasAllCurrents = true;
                
                for (const branchId of branchComponents) {
                    const branchComp = this.nodeValues.find(c => c.id === branchId);
                    if (!branchComp || branchComp.current === undefined) {
                        hasAllCurrents = false;
                        break;
                    }
                    totalCurrent += branchComp.current;
                }
                
                if (hasAllCurrents) {
                    return { current: totalCurrent };
                }
                return null;
            },
            component: componentAfterParallel,
            requires: branchComponents.map(id => `${id}.current`),
            solves: 'current',
            branchComponents: branchComponents
        });
        
        console.log(`Generated parallel sum equation: ${afterComp.name}.current = sum of ${branchComponents.length} branches`);
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
            for (let eqIndex = 0; eqIndex < this.equationList.length; eqIndex++) {
                const eq = this.equationList[eqIndex];
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
                    
                    console.log(`✓ Solved ${eq.type} (eq#${eqIndex}) for ${comp.name}: ${eq.solves} = ${result[eq.solves]}`);
                    console.log(`  Equation: ${eq.equation}`);
                    console.log(`  Defined: ${varName}`);
                    changesMade = true;
                }
            }
            
            // Apply Kirchhoff's laws (only KVL series needs special handling for reference voltage)
            const kirchhoffChanges = this.applyKVLSeries(definedVariables);
            changesMade = kirchhoffChanges || changesMade;
            
            // Try to calculate voltages directly from active paths
            const pathVoltageChanges = this.calculateVoltagesFromPaths(definedVariables);
            changesMade = pathVoltageChanges || changesMade;
        }
        
        console.log(`\nSolver completed in ${iterations} iterations`);
        console.log('All defined variables:', Array.from(definedVariables).sort());
        
        // Check which variables are still undefined by comparing with initial extraction
        const allPossibleVars = [];
        this.nodeValues.forEach(comp => {
            if (comp.type !== 'battery' && comp.resistance === undefined) {
                allPossibleVars.push(`${comp.id}.resistance`);
            }
            if (comp.voltage === undefined) {
                allPossibleVars.push(`${comp.id}.voltage`);
            }
            if (comp.current === undefined) {
                allPossibleVars.push(`${comp.id}.current`);
            }
            if (comp.power === undefined) {
                allPossibleVars.push(`${comp.id}.power`);
            }
        });
        
        const stillUndefined = allPossibleVars.filter(v => !definedVariables.has(v));
        if (stillUndefined.length > 0) {
            console.warn('Still undefined:', stillUndefined);
        } else {
            console.log('✓ All variables solved!');
        }
        
        // Cross-validate results
        this.crossValidate();
        
        return this.nodeValues;
    }
    
    applyKVLSeries(definedVariables) {
        // Special handling for KVL series: sum of voltages must equal reference voltage
        // This can't be expressed as a simple solve() function because it needs to find
        // the reference voltage (either battery or parallel sibling)
        let changesMade = false;
        
        const seriesEquations = this.equationList.filter(eq => eq.type === 'kvl_series');
        
        for (const eq of seriesEquations) {
            if (!eq.components) continue;
            
            // Find equation index for logging
            const eqIndex = this.equationList.indexOf(eq);
            
            const components = eq.components.map(id => 
                this.nodeValues.find(c => c.id === id)
            ).filter(c => c !== undefined);
            
            if (components.length < 2) continue;
            
            // Find reference voltage for this series group
            let referenceVoltage = null;
            let referenceSource = 'battery';
            
            // First, check if this series group is part of a parallel structure
            // If so, use the parallel sibling's voltage as reference
            const parallelSiblingVoltage = this.getParallelSiblingVoltageFromPaths(eq.components);
            if (parallelSiblingVoltage !== null) {
                referenceVoltage = parallelSiblingVoltage;
                referenceSource = 'parallel sibling';
            } else {
                // Otherwise, use battery voltage as reference for series calculations
                const battery = this.nodeValues.find(c => c.type === 'battery');
                if (battery && battery.voltage !== undefined) {
                    referenceVoltage = battery.voltage;
                    referenceSource = 'battery';
                }
            }
            
            if (referenceVoltage !== null) {
                const knownVoltages = components.filter(c => c.voltage !== undefined);
                const unknownVoltages = components.filter(c => c.voltage === undefined);
                
                // If only one unknown, calculate it
                if (unknownVoltages.length === 1 && knownVoltages.length > 0) {
                    // For each known component, check if it represents a nested parallel structure
                    // If it does, use the parallel section's total voltage instead
                    let sumKnown = 0;
                    
                    for (const knownComp of knownVoltages) {
                        // Check if this component is a representative of a parallel section
                        // by seeing if referenceSource is NOT 'parallel sibling' (meaning this is the outer series)
                        if (referenceSource !== 'parallel sibling') {
                            const nestedVoltage = this.getEffectiveVoltageFromPaths(knownComp.id);
                            sumKnown += nestedVoltage !== null ? nestedVoltage : knownComp.voltage;
                        } else {
                            // This is a series within a parallel section, just use the component's voltage
                            sumKnown += knownComp.voltage;
                        }
                    }
                    
                    const remaining = referenceVoltage - sumKnown;
                    const varName = `${unknownVoltages[0].id}.voltage`;
                    unknownVoltages[0].voltage = Math.max(0, remaining);
                    definedVariables.add(varName);
                    console.log(`✓ KVL Series (eq#${eqIndex}): ${unknownVoltages[0].name}.voltage = ${unknownVoltages[0].voltage}V (${referenceVoltage}V from ${referenceSource} - ${sumKnown}V)`);
                    console.log(`  Equation: ${eq.equation}`);
                    console.log(`  Defined: ${varName}`);
                    changesMade = true;
                }
            }
        }
        
        return changesMade;
    }
    
    // Calculate voltages for all components based on active paths
    calculateVoltagesFromPaths(definedVariables) {
        let changesMade = false;
        
        if (this.activePaths.length === 0) return false;
        
        // Get battery voltage as reference
        const battery = this.nodeValues.find(c => c.type === 'battery');
        if (!battery || battery.voltage === undefined) return false;
        
        const batteryVoltage = battery.voltage;
        
        // Find where paths diverge (start of parallel section)
        let divergeIndex = 0;
        if (this.activePaths.length > 1) {
            for (let i = 0; i < Math.min(...this.activePaths.map(p => p.length)); i++) {
                const firstPathComp = this.activePaths[0][i];
                if (this.activePaths.every(path => path[i] === firstPathComp)) {
                    divergeIndex = i + 1;
                } else {
                    break;
                }
            }
        }
        
        // Find where paths converge (end of parallel section)
        let convergeIndex = this.activePaths[0].length;
        if (this.activePaths.length > 1) {
            for (let i = 1; i <= Math.min(...this.activePaths.map(p => p.length)); i++) {
                const firstPathComp = this.activePaths[0][this.activePaths[0].length - i];
                if (this.activePaths.every(path => path[path.length - i] === firstPathComp)) {
                    convergeIndex = this.activePaths[0].length - i;
                } else {
                    break;
                }
            }
        }
        
        console.log(`[Path Voltage Calc] Diverge at index ${divergeIndex}, converge at index ${convergeIndex}`);
        
        // For each path, calculate voltages
        for (const path of this.activePaths) {
            // Skip battery at start and end
            let totalCalculatedVoltage = 0;
            const componentsToCalculate = [];
            
            for (let i = 1; i < path.length - 1; i++) {
                const compId = path[i];
                const comp = this.nodeValues.find(c => c.id === compId);
                if (!comp) continue;
                
                const varName = `${comp.id}.voltage`;
                
                // Check if in parallel section
                const isInParallelSection = (divergeIndex < convergeIndex) && (i >= divergeIndex && i < convergeIndex);
                
                if (comp.voltage !== undefined) {
                    totalCalculatedVoltage += comp.voltage;
                } else {
                    componentsToCalculate.push({ comp, varName, isInParallelSection });
                }
            }
            
            // If all components in path have voltage except one, calculate it
            if (componentsToCalculate.length === 1) {
                const { comp, varName, isInParallelSection } = componentsToCalculate[0];
                
                // Calculate remaining voltage
                let referenceVoltage = batteryVoltage;
                
                // If this is a parallel section, check sibling paths for reference
                if (isInParallelSection && this.activePaths.length > 1) {
                    for (const siblingPath of this.activePaths) {
                        if (siblingPath === path) continue;
                        
                        let siblingVoltage = 0;
                        let hasAllVoltages = true;
                        
                        for (let i = divergeIndex; i < convergeIndex && i < siblingPath.length; i++) {
                            const sibCompId = siblingPath[i];
                            const sibComp = this.nodeValues.find(c => c.id === sibCompId);
                            if (!sibComp || sibComp.voltage === undefined) {
                                hasAllVoltages = false;
                                break;
                            }
                            siblingVoltage += sibComp.voltage;
                        }
                        
                        if (hasAllVoltages) {
                            referenceVoltage = siblingVoltage;
                            console.log(`[Path Voltage Calc] Using sibling voltage ${siblingVoltage}V as reference for ${comp.name}`);
                            break;
                        }
                    }
                }
                
                const calculatedVoltage = Math.max(0, referenceVoltage - totalCalculatedVoltage);
                comp.voltage = calculatedVoltage;
                definedVariables.add(varName);
                console.log(`✓ Path Voltage Calc: ${comp.name}.voltage = ${calculatedVoltage}V (${referenceVoltage}V - ${totalCalculatedVoltage}V)`);
                console.log(`  Defined: ${varName}`);
                changesMade = true;
            }
        }
        
        return changesMade;
    }
    
    // Helper function to get the effective voltage for a component using activePaths
    // If the component is part of a parallel section, return the voltage across that section
    getEffectiveVoltageFromPaths(componentId) {
        // Find all paths that contain this component
        const pathsWithComponent = this.activePaths.filter(path => path.includes(componentId));
        
        if (pathsWithComponent.length === 0) return null;
        
        // If component appears in multiple paths, it's part of a parallel section
        if (pathsWithComponent.length > 1) {
            // Find the path containing this component
            const pathWithComp = pathsWithComponent[0];
            
            // Get the position of the component in its path
            const compIndex = pathWithComp.indexOf(componentId);
            
            // Find components in the same parallel section (same position in different paths)
            // by finding where paths diverge and converge
            
            // Find where parallel section starts (where paths diverge)
            let divergeIndex = 0;
            for (let i = 0; i < Math.min(...pathsWithComponent.map(p => p.length)); i++) {
                const firstPathComp = pathsWithComponent[0][i];
                if (pathsWithComponent.every(path => path[i] === firstPathComp)) {
                    divergeIndex = i + 1; // Diverge after this common component
                } else {
                    break;
                }
            }
            
            // Find where parallel section ends (where paths converge)
            let convergeIndex = pathWithComp.length;
            for (let i = 1; i <= Math.min(...pathsWithComponent.map(p => p.length)); i++) {
                const firstPathComp = pathsWithComponent[0][pathsWithComponent[0].length - i];
                if (pathsWithComponent.every(path => path[path.length - i] === firstPathComp)) {
                    convergeIndex = pathWithComp.length - i;
                } else {
                    break;
                }
            }
            
            // Check if our component is in the parallel section
            if (compIndex >= divergeIndex && compIndex < convergeIndex) {
                // Component is in a parallel section
                // Get the total voltage across this component's branch in the parallel section
                let branchVoltage = 0;
                let hasAllVoltages = true;
                
                for (let i = divergeIndex; i < convergeIndex; i++) {
                    const compId = pathWithComp[i];
                    const comp = this.nodeValues.find(c => c.id === compId);
                    if (!comp || comp.voltage === undefined) {
                        hasAllVoltages = false;
                        break;
                    }
                    branchVoltage += comp.voltage;
                }
                
                return hasAllVoltages ? branchVoltage : null;
            }
        }
        
        // Component is not in a parallel section, just return its voltage
        const comp = this.nodeValues.find(c => c.id === componentId);
        return comp && comp.voltage !== undefined ? comp.voltage : null;
    }
    
    // Helper function to find parallel sibling voltage using activePaths
    getParallelSiblingVoltageFromPaths(seriesComponentIds) {
        if (!seriesComponentIds || seriesComponentIds.length === 0) return null;
        
        // Find the path containing these series components (all of them must be in sequence)
        const pathWithComponents = this.activePaths.find(path => {
            // Check if all series components are in this path in sequence
            const firstIndex = path.indexOf(seriesComponentIds[0]);
            if (firstIndex === -1) return false;
            
            // Check if all components appear consecutively
            for (let i = 0; i < seriesComponentIds.length; i++) {
                if (path[firstIndex + i] !== seriesComponentIds[i]) {
                    return false;
                }
            }
            return true;
        });
        
        if (!pathWithComponents) return null;
        
        // Find all paths (potential parallel siblings)
        const allPaths = this.activePaths;
        
        if (allPaths.length < 2) return null; // No parallel paths
        
        // Get the position of the first series component in its path
        const firstCompIndex = pathWithComponents.indexOf(seriesComponentIds[0]);
        const lastCompIndex = firstCompIndex + seriesComponentIds.length - 1;
        
        // Find where parallel section starts (where paths diverge)
        let divergeIndex = 0;
        for (let i = 0; i < Math.min(...allPaths.map(p => p.length)); i++) {
            const firstPathComp = allPaths[0][i];
            if (allPaths.every(path => path[i] === firstPathComp)) {
                divergeIndex = i + 1;
            } else {
                break;
            }
        }
        
        // Find where parallel section ends (where paths converge)
        let convergeIndex = pathWithComponents.length;
        for (let i = 1; i <= Math.min(...allPaths.map(p => p.length)); i++) {
            const firstPathComp = allPaths[0][allPaths[0].length - i];
            if (allPaths.every(path => path[path.length - i] === firstPathComp)) {
                convergeIndex = pathWithComponents.length - i;
            } else {
                break;
            }
        }
        
        // Check if our components are in a parallel section
        if (firstCompIndex >= divergeIndex && lastCompIndex < convergeIndex) {
            // Find a sibling path (different path in the parallel section)
            for (const siblingPath of allPaths) {
                if (siblingPath === pathWithComponents) continue;
                
                // Calculate total voltage across the sibling branch
                let siblingVoltage = 0;
                let hasAllVoltages = true;
                
                for (let i = divergeIndex; i < convergeIndex && i < siblingPath.length; i++) {
                    const compId = siblingPath[i];
                    const comp = this.nodeValues.find(c => c.id === compId);
                    if (!comp || comp.voltage === undefined) {
                        hasAllVoltages = false;
                        break;
                    }
                    siblingVoltage += comp.voltage;
                }
                
                if (hasAllVoltages) {
                    return siblingVoltage;
                }
            }
        }
        
        return null;
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
        
        // First, propagate values from equivalent components back to original components
        this.nodeValues.forEach(equiv => {
            if (equiv.type === 'equivalent' && equiv.originalComponents) {
                if (equiv.connectionType === 'series') {
                    // Series: same current through all, voltages add up
                    if (equiv.current !== undefined) {
                        equiv.originalComponents.forEach(comp => {
                            comp.current = equiv.current;
                        });
                    }
                } else if (equiv.connectionType === 'parallel') {
                    // Parallel: same voltage across all, currents add up
                    if (equiv.voltage !== undefined) {
                        equiv.originalComponents.forEach(comp => {
                            comp.voltage = equiv.voltage;
                        });
                    }
                }
            }
        });
        
        // Update each component with solved values
        this.nodeValues.forEach(nodeValue => {
            // Skip equivalent components (they're virtual)
            if (nodeValue.type === 'equivalent') return;
            
            const component = window.components.find(c => c.id === nodeValue.id);
            
            if (!component || !component.values) {
                console.warn(`Component ${nodeValue.id} not found`);
                return;
            }
            
            let updatedFields = [];
            
            // Update resistance
            if (nodeValue.resistance !== undefined && component.type !== 'battery') {
                if (typeof component.values.resistance === 'object') {
                    component.values.resistance.value = nodeValue.resistance;
                } else {
                    component.values.resistance = nodeValue.resistance;
                }
                updatedFields.push('R');
                updateCount++;
            }
            
            // Update voltage (voltageDrop for most components, voltage for battery)
            if (nodeValue.voltage !== undefined) {
                // If battery voltage was originally negative, reverse all voltages
                const voltageValue = this.negativeVoltage ? -nodeValue.voltage : nodeValue.voltage;
                
                if (component.type === 'battery') {
                    if (typeof component.values.voltage === 'object') {
                        component.values.voltage.value = voltageValue;
                    } else {
                        component.values.voltage = voltageValue;
                    }
                } else {
                    // For non-battery components, update voltageDrop or voltage
                    if (component.values.voltageDrop !== undefined) {
                        if (typeof component.values.voltageDrop === 'object') {
                            component.values.voltageDrop.value = voltageValue;
                        } else {
                            component.values.voltageDrop = voltageValue;
                        }
                    } else if (component.values.voltage !== undefined) {
                        if (typeof component.values.voltage === 'object') {
                            component.values.voltage.value = voltageValue;
                        } else {
                            component.values.voltage = voltageValue;
                        }
                    }
                }
                updatedFields.push('V');
                updateCount++;
            }
            
            // Update current
            if (nodeValue.current !== undefined) {
                if (typeof component.values.current === 'object') {
                    component.values.current.value = nodeValue.current;
                } else {
                    component.values.current = nodeValue.current;
                }
                updatedFields.push('I');
                updateCount++;
            }
            
            // Update power
            if (nodeValue.power !== undefined) {
                if (typeof component.values.power === 'object') {
                    component.values.power.value = nodeValue.power;
                } else {
                    component.values.power = nodeValue.power;
                }
                updatedFields.push('P');
                updateCount++;
            }
            
            console.log(`✓ Updated ${component.values.name} [${updatedFields.join(', ')}]:`, {
                R: nodeValue.resistance !== undefined ? `${nodeValue.resistance}Ω` : '-',
                V: nodeValue.voltage !== undefined ? `${nodeValue.voltage}V` : '-',
                I: nodeValue.current !== undefined ? `${nodeValue.current}A` : '-',
                P: nodeValue.power !== undefined ? `${nodeValue.power}W` : '-'
            });
        });
        
        console.log(`\n✓ Updated ${updateCount} values across ${this.nodeValues.length} components`);
    }
}

export { CircuitSim };