<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import DevSettingSection from "./DevSettingSection.svelte";

	let { setting, props } = $props();

	let activeSection = $state("");
	let navItems: HTMLButtonElement[] = $state([]);
	let indicatorTop = $state(0);
	let indicatorHeight = $state(0);

	const propertyTypeMap = {
		0: ["Css", "Function"],
		1: ["Css"],
		2: ["Css"],
		3: ["Function"],
	};

	function getExtArray(property: any) {
		if (typeof property === "number") {
			return propertyTypeMap[property as keyof typeof propertyTypeMap];
		}
		return property;
	}

	const sections = $derived(Object.entries(props).filter(([title]) => title !== "updateConfig"));

	$effect(() => {
		if (sections.length > 0 && !activeSection) {
			activeSection = sections[0][0];
		}
	});

	$effect(() => {
		const activeIndex = sections.findIndex(([title]) => title === activeSection);
		const activeItem = navItems[activeIndex];
		if (!activeItem) return;
		indicatorTop = activeItem.offsetTop;
		indicatorHeight = activeItem.offsetHeight;
	});

	const runTypeNameMap = {
		var: "Variable",
		click: "On Click",
		constant: "Constant CSS",
		ui: "UI Script",
		setup: "Startup Script",
		enable: "On Enable",
		disable: "On Disable",
		update: "On Change",
	};
</script>

<div class="styleshift-config-sub-section">
	<nav class="logic-sidebar">
		<span
			class="logic-indicator"
			class:visible={indicatorHeight > 0}
			style:transform="translateY({indicatorTop}px)"
			style:height="{indicatorHeight}px"
		></span>

		{#each sections as [title, _property], index (title)}
			<button
				class="logic-nav-item"
				class:active={activeSection === title}
				bind:this={navItems[index]}
				onclick={() => (activeSection = title)}
			>
				{runTypeNameMap[title as keyof typeof runTypeNameMap] || title}
			</button>
		{/each}
	</nav>

	<div class="logic-workspace-area">
		{#each sections as [title, property] (title)}
			{#if activeSection === title}
				<div class="workspace-mount" in:fly={{ x: 12, duration: 280, delay: 120 }} out:fade={{ duration: 120 }}>
					<DevSettingSection
						{setting}
						runType={title}
						extArray={getExtArray(property)}
						onUpdateConfig={props.updateConfig}
						isWorkspace={true}
					/>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style lang="scss">
	.styleshift-config-sub-section {
		display: flex;
		flex-direction: row;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}

	.logic-sidebar {
		position: relative;
		width: 160px;
		display: flex;
		flex-direction: column;
		padding: 8px 0;
		border-right: 1px solid var(--border-color);
		box-sizing: border-box;
		overflow-y: auto;
	}

	.logic-indicator {
		position: absolute;
		left: 0;
		top: 0;
		width: 2px;
		background: var(--theme-0);
		border-radius: 2px;
		opacity: 0;
		pointer-events: none;
		transition:
			transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			opacity 0.2s;

		&.visible {
			opacity: 1;
		}
	}

	.logic-nav-item {
		padding: 7px 16px;
		background: transparent;
		border: none;
		color: var(--font-color-dim);
		font-size: 13px;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition:
			color 0.2s,
			font-weight 0.2s;

		&:hover {
			color: var(--font-color);
		}

		&.active {
			color: var(--font-color);
			font-weight: 600;
		}
	}

	.logic-workspace-area {
		flex: 1;
		height: 100%;
		overflow-y: auto;
		padding: 16px 20px;
		box-sizing: border-box;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--border-color);
			border-radius: 10px;
		}
	}

	.workspace-mount {
		height: 100%;
	}
</style>
