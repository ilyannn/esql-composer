import { TracingOption } from "./types";



export async function createTrace<T>(
    apiUrl: string,
    apiKey: string,
    tracingOption: TracingOption,
    callback: () => T
): Promise<void> {
    if (!tracingOption.enabled) {
        return;
    }

    const traceData = callback();

    const response = await fetch(
        `${apiUrl}/${tracingOption.indexName}/_doc`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `ApiKey ${apiKey}`,
            },
            body: JSON.stringify(traceData),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to index trace data: ${response.statusText}`);
    }
}
