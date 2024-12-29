import { ScoreboardIdentity, ScoreboardScoreInfo, world } from '@minecraft/server';

/**
 * Converts the in-game Scoreboard Objective participants to a JS Object
 * @param objectiveName
 *
 * @returns An object containing the objective participants values
 * The property key is the Player, Entity or FakePlayer displayName
 * The property value is the Player, Entity or Fake player score {number}
 */
export function getObjective<T>(objectiveName: string): T {
	// Any object with keys as string and values as number
	const scoreboardObject: Record<string, number> = {};
	const scoreboardObjective = world.scoreboard.getObjective(objectiveName);

	scoreboardObjective?.getScores().forEach((score: ScoreboardScoreInfo): void => {
		scoreboardObject[score.participant.displayName] = score.score;
	});

	return scoreboardObject as T;
}

/**
 * Converts a JS Object with key, value pairs of to an in-game Scoreboard Objective participants
 * @param objectiveName
 * @param scoreboardObject
 *
 * The scoreboardObject property keys will be the Player, Entity or FakePlayer displayNames
 * The scoreboardObject property values will be the Player, Entity or Fake player scores
 */
export function setObjective(objectiveName: string, scoreboardObject: object): void {
	const scoreboardObjective = world.scoreboard.getObjective(objectiveName);
	const participants = scoreboardObjective?.getParticipants();

	Object.entries(scoreboardObject).forEach(([key, value]: [string, number]): void => {
		const player: ScoreboardIdentity | undefined = participants?.find(
			(participant: ScoreboardIdentity): boolean => participant.displayName === key
		);
		player && scoreboardObjective?.setScore(player, value);
	});
}
