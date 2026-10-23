<script lang="ts">
	import { navigating } from '$app/state';
	import { browser } from '$app/environment';

	const COMPLETE_HOLD_MS = 250;
	const CLIENT_NAVIGATION_TYPES = ['link', 'form', 'goto', 'popstate'];

	type Props = {
		color?: string;
		heightPx?: number;
		trickleSpeed?: number;
		maxProgress?: number;
		fadeDurationMs?: number;
	};

	let {
		color = '#229ED9',
		heightPx = 3,
		trickleSpeed = 60,
		maxProgress = 90,
		fadeDurationMs = 300
	}: Props = $props();

	const prefersReducedMotion =
		browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let width = $state(0);
	let shown = $state(false);
	let isNavigating = false;

	let rafId = 0;
	let holdTimer: ReturnType<typeof setTimeout>;
	let resetTimer: ReturnType<typeof setTimeout>;
	let lastFrameTime = 0;

	function stopTrickle() {
		cancelAnimationFrame(rafId);
	}

	function startTrickle() {
		clearTimeout(holdTimer);
		clearTimeout(resetTimer);
		stopTrickle();
		width = 0;
		shown = true;
		isNavigating = true;
		lastFrameTime = performance.now();
		rafId = requestAnimationFrame(frame);
	}

	function frame(now: number) {
		const deltaSeconds = (now - lastFrameTime) / 1000;
		lastFrameTime = now;
		width = Math.min(width + deltaSeconds * trickleSpeed, maxProgress);
		rafId = requestAnimationFrame(frame);
	}

	function completeNavigation() {
		stopTrickle();
		isNavigating = false;
		width = 100;
		holdTimer = setTimeout(finishFade, COMPLETE_HOLD_MS);
	}

	function finishFade() {
		if (prefersReducedMotion) {
			shown = false;
			width = 0;
			return;
		}
		shown = false;
		resetTimer = setTimeout(() => {
			width = 0;
		}, fadeDurationMs);
	}

	$effect(() => {
		const navigation = navigating;
		if (
			!isNavigating &&
			navigation.type !== null &&
			CLIENT_NAVIGATION_TYPES.includes(navigation.type)
		) {
			startTrickle();
		} else if (isNavigating && navigation.type === null) {
			// `navigating` from $app/state is a persistent object — it never becomes
			// null itself, only its properties do when a navigation settles
			completeNavigation();
		}
	});

	$effect(() => () => {
		stopTrickle();
		clearTimeout(holdTimer);
		clearTimeout(resetTimer);
	});
</script>

<div
	aria-hidden="true"
	class="fixed top-0 left-0 z-[60] w-full"
	style:height="{heightPx}px"
	style:opacity={shown ? 1 : 0}
	style:transition={prefersReducedMotion ? 'none' : `opacity ${fadeDurationMs}ms ease-out`}
>
	<div class="h-full" style:width="{width}%" style:background-color={color}></div>
</div>
