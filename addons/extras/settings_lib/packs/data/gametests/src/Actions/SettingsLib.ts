import { system, RawMessage } from '@minecraft/server';
import { UIData, AddonUIInformation, SettingsLibScriptEvents } from '../Models';

/**
 * @name saveUIData
 * @param {string} message - The addon name and UI information which are sent as a message together in a script event.
 * @remarks Splits the message into two parts which are first the addon name either in a string
 * or a RawMessage and second is the UI information, which are then save in the UI Data memory.
 *
 * @throws {SyntaxError} If the message is not valid and cannot be parsed.
 * @throws {TypeError} If the parsed message is not an array.
 * @throws {Error} If the parsed message is not a length of 2.
 * @throws {TypeError} If the addon name is not a string, is not an object, is null, or is an array.
 * @throws {TypeError} If the UI information is not an object, is null, or is an array.
 */
export const saveUIData = (message: string): void => {
	// The first and second index of the stringified JSON are addon name and UI information respectively
	let parsedMessage: [string | RawMessage, AddonUIInformation];
	// If the message is not valid and cannot be parsed, then throw a syntax error
	try {
		parsedMessage = JSON.parse(message);
	} catch {
		throw new SyntaxError(`Failed to parse message during sending.\nMessage provided: ${message}.`);
	}

	// If the parsed message is not an array, then throw a type error
	if (!Array.isArray(parsedMessage)) {
		throw new TypeError(`UI Data sent to the Settings Lib addon during sending is invalid. Expected type "array", but received "${typeof parsedMessage}".\nMessage provided: ${message}.`);
	}
	// If the parsed message is not a length of 2, then throw an error
	if (parsedMessage.length !== 2) {
		throw new Error(`UI Data sent to the Settings Lib addon during sending is invalid. Expected a length of 2, but received a length of ${parsedMessage.length}.\nMessage provided: ${message}.`);
	}

	const [addonName, uiInfo]: [string | RawMessage, AddonUIInformation] = parsedMessage;

	// If the addon name is not a string, is not an object, is null, or is an array, then throw a type error
	if (typeof addonName !== 'string' && (typeof addonName !== 'object' || addonName === null || Array.isArray(addonName))) {
		const actualType: string = addonName === null ? 'null' : Array.isArray(addonName) ? 'array' : typeof addonName;

		throw new TypeError(`Addon Name sent to the Settings Lib addon during sending is invalid. Expected type "string" or "object" (non-null, non-array), but received "${actualType}".\nMessage provided: ${message}.`);
	}
	// If the UI information is not an object, is null, or is an array, then throw a type error
	if (typeof uiInfo !== 'object' || uiInfo === null || Array.isArray(uiInfo)) {
		const actualType: string = uiInfo === null ? 'null' : Array.isArray(uiInfo) ? 'array' : typeof uiInfo;

		throw new TypeError(`UI Information sent to the Settings Lib addon during sending is invalid. Expected type "object" (non-null, non-array), but received "${actualType}".\nMessage provided: ${message}.`);
	}

	/**
	 * If the addon name is string, then we will save it directly to UIData,
	 * but if it is RawMessage, then we will have to find the exact object reference from the UIData to
	 * check if there is a similar object reference with same keys and values, if it does then update that to the updated UI Information,
	 * if it doesn't exist, then save it to the UIData
	 */
	if (typeof addonName === 'string') {
		UIData.set(addonName, uiInfo);
	} else {
		let addonNameExist: boolean = false;

		for (const savedAddonName of UIData.keys()) {
			if (typeof savedAddonName === 'object' && deepObjectEqual(savedAddonName, addonName)) {
				UIData.set(savedAddonName, uiInfo);

				addonNameExist = true;

				break;
			}
		}

		if (!addonNameExist) {
			UIData.set(addonName, uiInfo);
		}
	}
};

/**
 * @name deleteUIData
 * @param {string} addonName - The addon name which can either be in a string or a stringified RawMessage to be deleted from the UI Data memory.
 * @remarks Deletes the UI Data of the addon name from the memory.
 *
 * @throws {SyntaxError} If the addon name is not valid and cannot be parsed.
 * @throws {TypeError} If the parsed addon name is not a string, is not an object, is null, or is an array.
 */
export const deleteUIData = (addonName: string): void => {
	let parsedAddonName: string | RawMessage;
	// If the addon name is not valid and cannot be parsed, then throw a syntax error
	try {
		parsedAddonName = JSON.parse(addonName);
	} catch {
		throw new SyntaxError(`Failed to parse Addon Name from message during removing.\nMessage provided: ${addonName}.`);
	}

	// If the parsed addon name is not a string, is not an object, is null, or is an array, then throw a type error
	if (typeof parsedAddonName !== 'string' && (typeof parsedAddonName !== 'object' || parsedAddonName === null || Array.isArray(parsedAddonName))) {
		const actualType: string = parsedAddonName === null ? 'null' : Array.isArray(parsedAddonName) ? 'array' : typeof parsedAddonName;

		throw new TypeError(`Addon Name sent to the Settings Lib addon during removing is invalid. Expected type "string" or "object" (non-null, non-array), but received "${actualType}".\nMessage provided: ${addonName}.`);
	}

	/**
	 * If the parsed addon name is string, then we will delete it directly,
	 * but if it is RawMessage, then we will have to find the exact object reference from the UIData to
	 * remove it finally as object references will be different even if all keys and values are same
	 */
	if (typeof parsedAddonName === 'string') {
		UIData.delete(parsedAddonName);
	} else {
		for (const savedAddonName of UIData.keys()) {
			if (typeof savedAddonName === 'object' && deepObjectEqual(parsedAddonName, savedAddonName)) {
				UIData.delete(savedAddonName);

				break;
			}
		}
	}
};

/**
 * @name deepObjectEqual
 * @param {object} a - The first object reference to compare to.
 * @param {object} b - The second object reference to compare to.
 * @returns Returns true if all the keys and values in both object references are the same, even for deeply nested objects.
 * @remarks Recursively compares the two objects and returns true if they are equivalent at all levels.
 */
export const deepObjectEqual = (a: object, b: object): boolean => Object.keys(a).length === Object.keys(b).length &&
	Object.entries(a).every(([k, v]: [string, unknown]): boolean => {
		if (typeof v !== 'object' || v === null) {
			return Object.prototype.hasOwnProperty.call(b, k) &&
				(b as Record<string, unknown>)[k] === v;
		}

		return Object.prototype.hasOwnProperty.call(b, k) &&
			deepObjectEqual(v, (b as Record<string, unknown>)[k] as object);
	});

/**
 * @name sendUIData
 * @param {string | RawMessage} addonName - The addon name which can either be in a string or a RawMessage to be sent to the Settings Lib addon.
 * @param {AddonUIInformation} uiInfo - The UI information associated with the addon name to be sent to the Settings Lib addon.
 * @remarks Sends the addon name associated with the UI information to the Settings Lib addon through the script event, which will then be saved in the memory of the Settings Lib addon.
 *
 * This is a helper function to be used in the other addon to communicate with the library addon and send UI Data to it.
 */
export const sendUIData = (addonName: string | RawMessage, uiInfo: AddonUIInformation): void => {
	// The first and second index of the array are addon name and UI information respectively which are then send in a stringified JSON
	system.sendScriptEvent(SettingsLibScriptEvents.sendUIData, JSON.stringify([addonName, uiInfo]));
};

/**
 * @name removeUIData
 * @param {string | RawMessage} addonName - The addon name which can either be in a string or a RawMessage to be removed from the Settings Lib addon.
 * @remarks Removes the UI Data with the same addon name from the memory of the Settings Lib addon.
 *
 * This is a helper function to be used in the other addon to communicate with the library addon and remove UI Data from it.
 */
export const removeUIData = (addonName: string | RawMessage): void => {
	system.sendScriptEvent(SettingsLibScriptEvents.removeUIData, JSON.stringify(addonName));
};
