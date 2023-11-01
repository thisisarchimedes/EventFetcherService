export type EventDescriptor = {
    name: string;
    signature: string;
    decodeData: {
        name: string;
        type: string;
        indexed: boolean;
    }[];
};
