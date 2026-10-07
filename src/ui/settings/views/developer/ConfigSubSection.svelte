<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import DevSettingSection from "./DevSettingSection.svelte";

	let { setting, props } = $props();

	let activeSection = $state("");

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

	const colorMap = {
		var: "#FFA500",
		click: "#00DFFF",
		constant: "#09ff00",
		ui: "#3232FF",
		setup: "#3232FF",
		enable: "#32CD32",
		disable: "#FF3232",
		update: "#FF00F5",
	};
</script>

<div class="styleshift-config-sub-section">
	<aside class="logic-sidebar">
		{#each sections as [title, _property] (title)}
			<button
				class="logic-nav-item"
				class:active={activeSection === title}
				onclick={() => (activeSection = title)}
				style:--section-color={colorMap[title as keyof typeof colorMap] || "#999999"}
			>
				<div class="nav-indicator"></div>
				<span class="nav-label">{runTypeNameMap[title as keyof typeof runTypeNameMap] || title}</span>
			</button>
		{/each}
	</aside>

	<div class="logic-workspace-area">
		{#each sections as [title, property] (title)}
			{#if activeSection === title}
				<div class="workspace-mount" in:fly={{ x: 10, duration: 300, delay: 150 }} out:fade={{ duration: 150 }}>
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
		width: 200px;
		display: flex;
		flex-direction: column;
		padding: 20px 10px;
		gap: 5px;
		margin: 10px;
	}

	.logic-nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 15px;
		background: transparent;
		border: none;
		color: var(--font-color-dim);
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;

		.nav-indicator {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--section-color);
			opacity: 0.4;
			transition: all 0.2s;
		}

		.nav-label {
			font-size: 13px;
			font-weight: 600;
		}

		&:hover {
			background: var(--bg-surface-hover);
			color: var(--font-color);
			.nav-indicator {
				opacity: 0.8;
				transform: scale(1.2);
			}
		}

		&.active {
			background: var(--bg-surface-hover);
			color: var(--theme-1);
			.nav-indicator {
				opacity: 1;
				transform: scale(1.3);
				box-shadow: 0 0 8px var(--section-color);
			}
		}
	}

	.logic-workspace-area {
		flex: 1;
		height: 100%;
		overflow-y: auto;
		padding: 30px;
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
