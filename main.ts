import { Plugin, Workspace } from "obsidian";
import { TreeView, VIEW_TYPE_TREE } from "./view";
import { WorkspaceLeaf } from "obsidian";

export default class TreePlugin extends Plugin {
	active: boolean = false;
	async onload() {
		this.registerView(VIEW_TYPE_TREE, (leaf) => new TreeView(leaf));

		this.addRibbonIcon("dice", "Activate view", () => {
			this.activateView();
		});
	}

	async onunload() {}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TREE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_TREE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}
