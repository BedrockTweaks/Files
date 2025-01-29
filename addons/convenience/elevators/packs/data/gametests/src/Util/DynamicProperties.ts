import { Entity, Vector3, World } from "@minecraft/server";

type PropertiesTypes = boolean | number | string | Vector3 | undefined;

/**
 * Converts the properties of the world or an entity from the enumType to a JS Object of type T
 * Enum keys and object properties should match for proper conversion.
 *
 * @template T - The type of the resulting object.
 * @param {World | Entity} from - The world or entity from which the properties are retrieved.
 * @param {{ [key: string]: string }} enumType - An object mapping property keys to dynamic property identifiers.
 *
 * @returns {T} An object containing the properties extracted based on the enumType.
 */
export const getProperties = <T>(from: World | Entity, enumType: { [key: string]: string }): T => {
	const propertiesObject: Record<string, PropertiesTypes> = {};

	Object.entries(enumType).forEach(([key, value]: [string, string]): void => {
		propertiesObject[key] = from.getDynamicProperty(value);
	});

	return propertiesObject as T;
};

/**
 * Converts a JavaScript object into dynamic properties based on the `enumType`
 * and saves them in the provided world or entity.
 * Enum keys and object properties should match for proper conversion.
 *
 * @param {World | Entity} to - The world or entity where the properties will be set.
 * @param {{ [key: string]: string }} enumType - An object mapping property keys to dynamic property identifiers.
 * @param {object} propertyObject - A JavaScript object containing the properties to be set.
 */
export const setProperties = (to: World | Entity, enumType: { [key: string]: string }, propertyObject: object): void => {
	Object.entries(propertyObject).forEach(([key, value]: [string, PropertiesTypes]): void => {
		const identifier: string | undefined = enumType[key];

		if (identifier) {
			to.setDynamicProperty(identifier, value);
		}
	});
};
