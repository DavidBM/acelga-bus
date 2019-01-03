import {GoogleDecodedContract, GoogleEvent} from './interfaces';
import {DecodedEvent, EventFactory} from '../corebus/interfaces';

export interface GoogleInstance extends GoogleEvent {
	data: GoogleDecodedContract;
}

export class Google implements GoogleInstance {
	public origin = 'Google';

	constructor(public data: GoogleDecodedContract) { }
}

export class GoogleEventFactory implements EventFactory<GoogleInstance, GoogleDecodedContract> {
    build(event: DecodedEvent<GoogleDecodedContract>): GoogleInstance {
        return new Google(event);
    }
}
