export interface Trucks {
	rounds: TruckRounds[]
}

export interface TruckRounds {
	id: string;
	dayRounds: Rounds[];
	nightRounds: Rounds[];
}

export interface Rounds {
	roundNumber: number;
	slots: Slot[];
}

export interface Slot {
	release: Release;
}

export interface Release {
	release: string;
	size: number;
	qty: number;
	colour: string;
}