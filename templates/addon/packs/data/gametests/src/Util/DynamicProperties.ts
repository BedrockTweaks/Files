import { Entity, Vector3, World } from '@minecraft/server';

type PropertiesTypes = boolean | number | string | Vector3 | undefined;

/**
 * Converts the properties of the world or an entity from the enumType to a JS Object of type T
 * Enum keys and object properties should match for proper conversion.
 *
 * @template T - The type of the resulting object.
 * @param {World | Entity} from - The world or entity from which the properties are retrieved.
 * @param {{ [key: string]: string }} enumType - An object mapping property keys to dynamic property identifiers.
 *
 * @returns {T} - An object containing the properties extracted based on the enumType.
 */
export function getProperties<T>(from: World | Entity, enumType: { [key: string]: string }): T {
	const propertiesObject: Record<string, PropertiesTypes> = {};

	Object.entries(enumType).forEach(([key, value]: [string, string]): void => {
		propertiesObject[key] = from.getDynamicProperty(value);
	});

	return propertiesObject as T;
}

/**
 * Converts a JavaScript object into dynamic properties based on the `enumType`
 * and saves them in the provided world or entity.
 * Enum keys and object properties should match for proper conversion.
 *
 * @template T - The type of a JavaScript object containing property keys and their corresponding values to be set.
 * @template K - The type of an object mapping property keys of T to dynamic property identifiers.
 * @param {World | Entity} to - The world or entity where the properties will be set.
 * @param {K} enumType - An object mapping property keys to dynamic property identifiers.
 * @param {T} propertyObject - A JavaScript object containing the properties to be set.
 */
export function setProperties<T extends Record<string, PropertiesTypes>, K extends Record<keyof T, string>>(to: World | Entity, enumType: K, propertyObject: T): void {
	Object.entries(propertyObject).forEach(([key, value]: [keyof T, PropertiesTypes]): void => {
		const identifier: string = enumType[key];

		to.setDynamicProperty(identifier, value);
	});
}
