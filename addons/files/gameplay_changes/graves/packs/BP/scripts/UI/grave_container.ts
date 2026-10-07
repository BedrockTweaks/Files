import { createContainerScreen } from '@bedrock-core/ui/container';
import graveContainer from './grave_container.screen';

/** Runtime handle over the 41 author-owned cells; protocol slots stay hidden. */
export const graveScreen = createContainerScreen(graveContainer);
