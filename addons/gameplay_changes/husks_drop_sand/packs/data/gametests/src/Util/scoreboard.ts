import { ScoreboardIdentity, ScoreboardObjective, ScoreboardScoreInfo, world } from '@minecraft/server';

/**
 * Converts the in-game Scoreboard Objective participants to a JS Object
 *
 * @template T - The type of the resulting object.
 * @param {string} objectiveName - The name of the scoreboard objective to retrieve.
 *
 * @returns {T} - An object where the keys are participant display names (Player, Entity, or FakePlayer) and the values are their respective scores.
 */
export function getObjective<T>(objectiveName: string): T {
	// Any object with keys as string and values as number
	const scoreboardObject: Record<string, number> = {};
	const scoreboardObjective: ScoreboardObjective | undefined = world.scoreboard.getObjective(objectiveName);

	scoreboardObjective?.getScores().forEach((score: ScoreboardScoreInfo): void => {
		scoreboardObject[score.participant.displayName] = score.score;
	});

	return scoreboardObject as T;
}

/**
 * Converts a JS Object with key, value pairs of to an in-game Scoreboard Objective participants
 *
 * @param {string} objectiveName - The name of the scoreboard objective to update.
 * @param {object} scoreboardObject - An object where the keys are participant display names (Player, Entity, or FakePlayer) and the values are their respective scores.
 */
export function setObjective(objectiveName: string, scoreboardObject: object): void {
	const scoreboardObjective: ScoreboardObjective | undefined = world.scoreboard.getObjective(objectiveName);
	const participants: ScoreboardIdentity[] | undefined = scoreboardObjective?.getParticipants();

	Object.entries(scoreboardObject).forEach(([key, value]: [string, number]): void => {
		const player: ScoreboardIdentity | undefined = participants?.find(
			(participant: ScoreboardIdentity): boolean => participant.displayName === key,
		);
		player && scoreboardObjective?.setScore(player, value);
	});
}
