export type EventDescriptor = {
    name: string;
    signature: string;
    decodeData: {
        type: string;
        indexed: boolean;
    }[];
};
