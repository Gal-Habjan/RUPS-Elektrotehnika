class CircuitSim {
    constructor() {
        this.source;
        this.tree = [];
        this.paths = [];
        this.activePaths = [];
        this.running_sim = false;
    }

    findSource() {
        this.source = window.components.find(c => c.type === 'battery' && !c.componentObject.getData('isInPanel'));
        return this.source;
    }

    calc_voltage_consequent(nodes) {
        // calculate voltages across components
    }
    calc_voltage_parallel(nodes) {
        // calculate voltages across components
    }
    calc_current_consequent(nodes) {
        // calculate currents through components
    }
    calc_current_parallel(nodes) {
        // calculate currents through components
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
        this.pickActivePaths();
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
        // calculate voltages and currents for active paths
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

}

export { CircuitSim };
