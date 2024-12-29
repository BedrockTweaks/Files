import { Entity, Vector3, World } from '@minecraft/server';

type PropertiesTypes = boolean | number | string | Vector3 | undefined;

/**
 * Converts the properties of the world or an entity from the enumType to a JS Object of type T
 * Enum keys and object properties should be the same
 * @param from
 * @param enumType
 *
 * @returns An object containing the properties from the enumType
 */
export function getProperties<T>(from: World | Entity, enumType: { [key: string]: string }): T {
	const propertiesObject: Record<string, PropertiesTypes> = {};

	Object.entries(enumType).forEach(([key, value]: [string, string]): void => {
		propertiesObject[key] = from.getDynamicProperty(value);
	});

	return propertiesObject as T;
}

/**
 * Converts a JS Object into the properties from the enumType and saves it in the world or entity
 * Enum keys and object properties should be the same
 * @param to
 * @param propertyObject
 * @param enumType
 *
 */
export function setProperties(to: World | Entity, enumType: { [key: string]: string }, propertyObject: object): void {
	Object.entries(propertyObject).forEach(([key, value]: [string, PropertiesTypes]): void => {
		const identifier: string = enumType[key];

		if (identifier) {
			to.setDynamicProperty(identifier, value);
		}
	});
}
