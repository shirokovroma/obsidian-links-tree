import { link } from "fs";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_TREE = "tree-view";

export class TreeView extends ItemView {
	file: TFile;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_TREE;
	}

	getDisplayText() {
		return "Tree view";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		// add refresh button
		const refreshButton = container.createEl("button", { text: "Refresh" });
		refreshButton.addEventListener("click", () => {
			this.onOpen();
		});

		this.printAllLinks(container);
	}

	async onClose() {
		// Nothing to clean up.
	}
	// function to print all links in the current file
	async printAllLinks(container: Element): Promise<void> {
		const file = this.app.workspace.getActiveFile();

		if (file === null) {
			console.log("No file is currently open");
			return;
		}
		this.file = file;
		// Create root element for the tree
		const treeRoot = container.createEl("ul");
		// Set styles to make the root element scrollable
		// treeRoot.style.maxHeight = "400px"; // Set a maximum height
		treeRoot.style.overflowY = "auto"; // Enable vertical scrolling
		treeRoot.style.overflowX = "auto"; // Enable vertical scrolling

		await this.createTreeNode(treeRoot, file);
	}

	async createTreeNode(
		parentElement: HTMLElement,
		file: TFile
	): Promise<void> {
		const fileCache = this.app.metadataCache.getFileCache(file);
		const fileLinks = fileCache?.links;
		console.log(fileLinks);

		if (!fileLinks) return;
		// Skip self-referencing links
		const fileLinksWithoutBaseFile = fileLinks.filter(
			(link) => link.link !== this.file.basename
		);
		// make unique
		// const uniqueLinks = [
		// 	...new Set(fileLinksWithoutBaseFile.map((link) => link.link)),
		// ];
		var linksHM = new Map();
		fileLinksWithoutBaseFile.forEach((link) => {
			if (!linksHM.has(link.link)) {
				linksHM.set(link.link, link );
			}
		});
		const uniquelinks = Array.from(linksHM.values());
		console.log(uniquelinks);

		for (const fileLink of uniquelinks) {
			const listItem = parentElement.createEl("li");
			const linkText: string = fileLink.link;
			const linkedFile = this.app.metadataCache.getFirstLinkpathDest(
				linkText,
				file.path
			);

			const linkedFileItem = this.app.metadataCache.getFirstLinkpathDest(
				linkText,
				file.path
			);

			// Skip links to files without links
			if (
				linkedFileItem != null &&
				this.app.metadataCache
					.getFileCache(linkedFileItem)
					?.links
					?.filter((link) => link.link !== this.file.basename)
					?.length != 0
			) {
				const linkButton = listItem.createEl("button", { text: "+" });
				linkButton.style.marginRight = "0.5em";
				linkButton.style.height = "1em";
				linkButton.style.width = "1em";
				let subTree: HTMLElement | null = null;

				// Add event listener to the link button
				linkButton.addEventListener(
					"click",
					async (event: MouseEvent) => {
						event.stopPropagation(); // Prevent event bubbling
						linkButton.innerText =
							linkButton.innerText === "+" ? "-" : "+";
						// Toggle visibility if subtree already exists
						if (subTree) {
							subTree.style.display =
								subTree.style.display === "none"
									? "block"
									: "none";
							return;
						}

						// Fetch the linked file and create its subtree
						if (linkedFile) {
							subTree = listItem.createEl("ul", {
								cls: "sub-tree",
							});
							subTree.style.display = "none"; // Initially hide the subtree
							await this.createTreeNode(subTree, linkedFile);
							subTree.style.display = "block"; // Show the subtree after loading
						}
					}
				);
			}
			
			// Create a button to open the link in the editor
			const openButton = listItem.createEl("a", { text: fileLink.displayText });
			openButton.addEventListener("click", (event: MouseEvent) => {
				event.stopPropagation();

				if (linkedFile) {
					this.app.workspace.openLinkText(linkText, linkedFile.path);
				}
			});
		}
	}
}
