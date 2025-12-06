import { createNewComponent } from "../components/ComponentHelper.js";
class CircuitSim {
    constructor() {
        this.source;
        this.tree = [];
    }

    findSource() {
        this.source = window.components.find(c => c.type === 'battery');
        return this.source;
    }

    generate_tree() {
        this.findSource();
        this.tree = [];
        if (!this.source) return;
        
        // Simple DFS to generate tree
        /*
            start from source
            go to components.start or .end depending on where we came from
            go through node to wire which holds ajesent components
            if there is 2 components just add next component to tree and move onto next component
            if there is more than 2 components we have a branch recursivly generate tree for each branch
            all branches need to finish back at source node
            if they dont backtrack and try different paths

            example:
            1-2
            2-3
            2-4
            3-1
            4-5
            5-1
            tree = [1, 2, [3, [4, 5]], 1]
        */
        
        const visited = new Set();
        const path = [];
        
        // Start DFS from the positive terminal of the battery
        const result = this.dfs(this.source, this.source.start, null, visited, path);
        if (result) {
            this.tree = result;
        }
    }
    
    dfs(currentComponent, currentNode, previousNode, visited, path) {
        // Add current component to the path
        path.push(currentComponent);
        visited.add(currentComponent.id);
        
        // Get the next node (opposite end of the current component)
        const nextNode = currentNode === currentComponent.start ? currentComponent.end : currentComponent.start;
        
        // Check if we've completed the circuit (back to source's negative terminal)
        if (currentComponent !== this.source && nextNode === this.source.end) {
            path.push(this.source);
            const result = [...path];
            path.pop();
            visited.delete(currentComponent.id);
            return result;
        }
        
        // Get all components connected to the next node via the wire
        const adjacentComponents = this.getAdjacentComponents(nextNode, currentComponent);
        
        // Filter out visited components
        const unvisitedComponents = adjacentComponents.filter(comp => !visited.has(comp.id));
        
        if (unvisitedComponents.length === 0) {
            // Dead end, backtrack
            path.pop();
            visited.delete(currentComponent.id);
            return null;
        } else if (unvisitedComponents.length === 1) {
            // Single path, continue
            const nextComponent = unvisitedComponents[0];
            const nextComponentNode = nextComponent.start === nextNode ? nextComponent.start : nextComponent.end;
            const result = this.dfs(nextComponent, nextComponentNode, nextNode, visited, path);
            if (result) {
                return result;
            }
        } else {
            // Branch point - try each branch
            const branches = [];
            let allBranchesComplete = true;
            
            for (const nextComponent of unvisitedComponents) {
                const nextComponentNode = nextComponent.start === nextNode ? nextComponent.start : nextComponent.end;
                const branchResult = this.dfs(nextComponent, nextComponentNode, nextNode, visited, path);
                
                if (branchResult) {
                    branches.push(branchResult);
                } else {
                    allBranchesComplete = false;
                }
            }
            
            if (allBranchesComplete && branches.length > 0) {
                path.push(branches);
                const result = [...path];
                path.pop();
                path.pop();
                visited.delete(currentComponent.id);
                return result;
            }
        }
        
        // Backtrack
        path.pop();
        visited.delete(currentComponent.id);
        return null;
    }
    
    getAdjacentComponents(node, excludeComponent) {
        // Get all components connected through the wire at this node
        if (!node.wire) return [];
        
        const adjacentComponents = [];
        
        // Check all nodes in the same wire
        for (const wireNode of node.wire.nodes) {
            if (wireNode.component && wireNode.component.id !== excludeComponent.id) {
                // Check if this component's start or end is connected to this wire
                if (wireNode === wireNode.component.start || wireNode === wireNode.component.end) {
                    if (!adjacentComponents.find(c => c.id === wireNode.component.id)) {
                        adjacentComponents.push(wireNode.component);
                    }
                }
            }
        }
        
        return adjacentComponents;
    }

    init() {
        this.generate_tree();
    }

    run_sim() {
        // go throught the tree and calculate voltages and currents based on 
    }

}

export { CircuitSim };
