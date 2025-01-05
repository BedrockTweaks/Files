import { system, TicksPerSecond } from '@minecraft/server';
import { tickGrave } from './Actions';
import './Events';

system.runInterval((): void => {
	tickGrave();
}, TicksPerSecond);
