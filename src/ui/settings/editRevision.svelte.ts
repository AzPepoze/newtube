// Bumped after each saved edit, so views that read a raw setting object can re-derive.
let revision = $state(0);

export function getEditRevision(): number {
	return revision;
}

export function bumpEditRevision(): void {
	revision++;
}
