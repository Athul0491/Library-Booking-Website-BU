    export interface Availability{
        slots : Slot[];
        bookings : Slot[];
        isPreCreatedBooking : boolean;
        windowEnd : boolean;
    }

    export interface Slot{
        itemId: number;
        start: Date;
        end : Date;
        checksum : string;
        className : string;
    }
