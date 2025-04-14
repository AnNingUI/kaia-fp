export type JSONSchema = {
	type?: string;
	properties?: Record<string, JSONSchema>;
	items?: JSONSchema;
	enum?: any[];
	oneOf?: JSONSchema[];
	default?: any;
	description?: string;
	required?: string[];
};

export function schemaFrom<T>(example: T): JSONSchema {
	if (Array.isArray(example)) {
		return {
			type: "array",
			items: schemaFrom(example[0]),
		};
	} else if (typeof example === "object" && example !== null) {
		const properties: Record<string, JSONSchema> = {};
		const required: string[] = [];

		for (const key in example) {
			if (example.hasOwnProperty(key)) {
				const value = (example as any)[key];
				properties[key] = schemaFrom(value);
				required.push(key);
			}
		}

		return {
			type: "object",
			properties,
			required,
		};
	} else {
		return {
			type: typeof example,
		};
	}
}
