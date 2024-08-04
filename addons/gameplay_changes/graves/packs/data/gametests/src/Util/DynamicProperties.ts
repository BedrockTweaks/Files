import { Vector3, world } from '@minecraft/server';

/**
 * Converts the properties from the enumType to a JS Object of type T
 * Enum keys and object properties should be the same
 * @param enumType
 *
 * @returns An object containing the properties from the enumType
 */
export function getProperties<T>(enumType: { [key: string]: string }): T {
  const propertiesObject: Record<string, boolean | number | string | Vector3 | undefined> = {};

  Object.entries(enumType).forEach(([key, value]: [string, string]): void => {
    propertiesObject[key] = world.getDynamicProperty(value);
  });

  return propertiesObject as T;
}

/**
 * Converts a JS Object into the properties from the enumType
 * Enum keys and object properties should be the same
 * @param propertyObject
 * @param enumType
 *
 */
export function setProperties<T extends object>(enumType: { [key: string]: string }, propertyObject: T): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(propertyObject).forEach(([key, value]: [string, any]): void => {
    const identifier: string = enumType[key];

    if (identifier) {
      world.setDynamicProperty(identifier, value);
    }
  });
}
