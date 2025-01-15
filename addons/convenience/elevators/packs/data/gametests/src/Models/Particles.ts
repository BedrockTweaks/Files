import { MolangVariableMap } from "@minecraft/server";

export enum ElevatorsParticleIdentifiers {
	woolToElevatorNorthSouth = "minecraft:portal_north_south",
	woolToElevatorEastSouth = "minecraft:portal_east_west",
	elevatorTick = "bt:e.wool_to_elevator"
}

export const ElevatorTickParticleMolang: MolangVariableMap = new MolangVariableMap();
ElevatorTickParticleMolang.setVector3("variable.direction", { x: 0.25, y: 1, z: 0.25 });
ElevatorTickParticleMolang.setFloat("variable.speed", 0.2);

export const WoolToElevatorParticleMolang: MolangVariableMap = new MolangVariableMap();
WoolToElevatorParticleMolang.setFloat("variable.num_particles", 200);
