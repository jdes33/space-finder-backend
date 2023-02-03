// define what you expect a Space item to be, will be used by input validator
export interface Space {
    spaceId: string,
    name: string,
    location: string,
    photoUrl?: string
}