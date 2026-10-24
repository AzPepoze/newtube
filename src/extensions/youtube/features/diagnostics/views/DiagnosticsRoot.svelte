<script lang="ts">
	import { onMount } from "svelte";

	import { createSharePageState } from "../sharePage.svelte";
	import DiagnosticsPage from "./DiagnosticsPage.svelte";
	import SharePage from "./SharePage.svelte";

	type RootMode = "loading" | "share" | "viewer";

	const share = createSharePageState();
	let mode = $state<RootMode>("loading");

	async function chooseMode(): Promise<void> {
		const hasShareReport = await share.loadStoredReport();
		mode = hasShareReport ? "share" : "viewer";
	}

	onMount(() => {
		void chooseMode();
	});
</script>

{#if mode === "share"}
	<SharePage {share} />
{:else if mode === "viewer"}
	<DiagnosticsPage />
{/if}
