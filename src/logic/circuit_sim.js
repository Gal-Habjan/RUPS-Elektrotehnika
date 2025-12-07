class CircuitSim {
    constructor() {
        this.source;
        this.tree = [];
        this.paths = [];
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
        
    }

    run_sim() {
        // go throught the tree and calculate voltages and currents based on 
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
