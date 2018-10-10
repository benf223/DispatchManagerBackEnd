// Interface to describe the days rounds (trucks) containing all the trucks and their associated rounds
export interface Trucks {
	rounds: TruckRounds[]
}

// Interface for a Trucks rounds for a given day
export interface TruckRounds {
	id: string;
	dayRounds: Rounds[];
	nightRounds: Rounds[];
}

// Interface to describe a Round that a truck owns
export interface Rounds {
	roundNumber: number;
	slots: Slot[];
}

// Interface that describes a slot in a truck's round
export interface Slot {
	release: Release;
}

// Interface for the Release the will be used on the website.
export interface Release {
	release: string;
	size: number;
	qty: number;
	colour: string;
}

export interface FullRelease {
	receivedDate: string,
	release: string,
	client: string,
	route: string,
	qty20s: number,
	qty40s: number,
	choose: string,
	containerType: string,
	containerNumbers: string[],
	dueDate: string,
	dueTime: string,
	reference: string,
	notes: string,
	status: string,
	completeDate: string,
	invoiced: string,
	colour: string
}

// Interface to describe how a warning popup should be constructed
// message: the string to be displayed in the dialog as a header
// body:    string array for the message to be displayed in the body. 0=Main Body 1=Unused
//          (if 0 & 1) 0=Component Defined 1 1= Component Defined 2
// options: boolean array specifying which buttons to enable in the popup 0=OK 1=Cancel 2=Component Defined 1
//          3=Component Defined 2 4=Unused
// result:  string array of data to be returned depending on button press 0=Click outside dialog 1=OK 2=Cancel 3=Component Defined 1
//          4=Component Defined 2 5=Unused
export interface Warning {
	message: string;
	body: string[];
	options: boolean[];   // Defines what buttons should be available
	result: string[];     // Defines the form of response from the dialog
}

// Interface for a representation of a day
export interface Day {
	day: string;
	disabled: boolean;
}

// Interface that will be used by the WebService to update the releases on the client and server
export interface Change {
	truckID: string;
	increase1: Release;
	increase2: Release;
	decrease1: Release;
	decrease2: Release;
}

export interface User {
	username : string;
	token : string;
}
