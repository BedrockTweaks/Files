import { RawMessage } from '@minecraft/server';

export interface SettingsUIInformation {
	// The identifier of the script event which will be sent if the specific settings option is selected by the player
	id: string;
	// Whether the settings option can only be visible to OP players who have the Bedrock Tweaks OP tag on them or not
	op: boolean;
	// An optional field which can be used as a replacement for the text visible to the player in the form by using Raw Message
	rawMessage?: RawMessage | undefined;
}

export interface AddonUIInformation {
	// The setting name with its UI information
	[setting: string]: SettingsUIInformation;
}

// A Map which is used to store all the UI Data in the memory
export const UIData: Map<string | RawMessage, AddonUIInformation> = new Map<string | RawMessage, AddonUIInformation>();
