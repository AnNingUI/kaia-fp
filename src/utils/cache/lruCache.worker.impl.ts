let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (event: MessageEvent) => {
	const { type, interval } = event.data;

	if (type === "start") {
		if (intervalId) clearInterval(intervalId);
		intervalId = setInterval(() => {
			self.postMessage({ type: "sweep" });
		}, interval);
	} else if (type === "stop") {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}
};
